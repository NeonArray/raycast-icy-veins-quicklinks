#!/usr/bin/env bash
set -euo pipefail

INPUT_DIR="$1"
OUTPUT_DIR="$2"

: "${OPENAI_API_KEY:?Set OPENAI_API_KEY}"

MODEL="${MODEL:-gpt-image-1}"
SIZE="${SIZE:-1024x1024}"
PROMPT="${PROMPT:-Upscale this image to high resolution. Preserve exact composition, shapes, proportions, colors, and layout. Do not redesign, stylize, or add any new elements. Do not change the icon. Only improve resolution, sharpness, and clarity.}"

mkdir -p "$OUTPUT_DIR"

process_file() {
  local infile="$1"
  local filename
  local stem
  local outfile_png
  local outfile_jpg
  local tmpjson
  local b64

  filename="$(basename "$infile")"
  stem="${filename%.*}"
  outfile_png="$OUTPUT_DIR/${stem}.png"
  outfile_jpg="$OUTPUT_DIR/${stem}.jpg"
  tmpjson="$(mktemp)"

  echo "Processing: $filename"

  curl -sS https://api.openai.com/v1/images/edits \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -F "model=$MODEL" \
    -F "prompt=$PROMPT" \
    -F "image[]=@$infile" \
    -F "size=$SIZE" \
    -o "$tmpjson"

  b64="$(jq -r '.data[0].b64_json // empty' "$tmpjson")"

  if [[ -z "$b64" ]]; then
    echo "Failed for $filename"
    cat "$tmpjson"
    rm -f "$tmpjson"
    return 1
  fi

  # Save PNG first (API default)
  printf '%s' "$b64" | base64 --decode > "$outfile_png"

  # Convert to JPG (requires ImageMagick)
  if command -v magick >/dev/null 2>&1; then
    magick "$outfile_png" -quality 95 "$outfile_jpg"
    rm "$outfile_png"
  else
    echo "ImageMagick not found, keeping PNG for $filename"
  fi

  rm -f "$tmpjson"
  echo "Saved: $outfile_jpg"
}

export -f process_file
export OPENAI_API_KEY MODEL PROMPT SIZE OUTPUT_DIR

find "$INPUT_DIR" -type f \
  \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' \) \
  -print0 | while IFS= read -r -d '' file; do
    process_file "$file"
  done

echo "Done."
