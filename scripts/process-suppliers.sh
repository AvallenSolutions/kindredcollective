#!/bin/bash
# Process scraped supplier JSON files and generate SQL import script

OUTPUT_DIR="/home/user/kindredcollective/scripts"
INPUT_DIR="/tmp/kindred_suppliers"
SQL_FILE="$OUTPUT_DIR/import-suppliers.sql"
JSON_FILE="$OUTPUT_DIR/scraped-suppliers.json"

# Category determination function
determine_category() {
  local text="$1"
  text=$(echo "$text" | tr '[:upper:]' '[:lower:]')

  # Check specific patterns first
  if [[ "$text" == *"packaging"* ]] || [[ "$text" == *"bottle"* && "$text" == *"glass"* ]] || [[ "$text" == *"label"* && "$text" == *"print"* ]]; then
    echo "PACKAGING"
  elif [[ "$text" == *"branding"* ]] || [[ "$text" == *"design"* && "$text" == *"creative"* ]] || [[ "$text" == *"brand identity"* ]]; then
    echo "DESIGN"
  elif [[ "$text" == *"pr "* ]] || [[ "$text" == *"public relations"* ]] || [[ "$text" == *"comms"* && "$text" != *"e-comms"* ]] || [[ "$text" == *"communications"* ]]; then
    echo "PR"
  elif [[ "$text" == *"marketing"* ]] || [[ "$text" == *"social media"* ]]; then
    echo "MARKETING"
  elif [[ "$text" == *"consulting"* ]] || [[ "$text" == *"consultancy"* ]] || [[ "$text" == *"advisory"* ]] || [[ "$text" == *"strategy"* ]]; then
    echo "CONSULTING"
  elif [[ "$text" == *"distribution"* ]] || [[ "$text" == *"distro"* ]] || [[ "$text" == *"logistics"* ]] || [[ "$text" == *"bonded warehouse"* ]] || [[ "$text" == *"fulfilment"* ]]; then
    echo "DISTRIBUTION"
  elif [[ "$text" == *"photography"* ]] || [[ "$text" == *"photo"* ]] || [[ "$text" == *"video"* ]] || [[ "$text" == *"production studio"* ]]; then
    echo "PHOTOGRAPHY"
  elif [[ "$text" == *"bottling"* ]] || [[ "$text" == *"co-pack"* ]] || [[ "$text" == *"contract"* && "$text" == *"fill"* ]] || [[ "$text" == *"canning"* ]] || [[ "$text" == *"distillery"* ]]; then
    echo "CO_PACKING"
  elif [[ "$text" == *"ingredient"* ]] || [[ "$text" == *"flavour"* ]]; then
    echo "INGREDIENTS"
  elif [[ "$text" == *"accounting"* ]] || [[ "$text" == *"finance"* ]] || [[ "$text" == *"tax"* ]]; then
    echo "FINANCE"
  elif [[ "$text" == *"recruitment"* ]] || [[ "$text" == *"talent"* ]] || [[ "$text" == *"hiring"* ]]; then
    echo "RECRUITMENT"
  elif [[ "$text" == *"software"* ]] || [[ "$text" == *"digital"* && "$text" == *"platform"* ]]; then
    echo "SOFTWARE"
  elif [[ "$text" == *"sustainability"* ]] || [[ "$text" == *"sustainable"* ]]; then
    echo "SUSTAINABILITY"
  elif [[ "$text" == *"event"* ]]; then
    echo "CONSULTING"
  else
    echo "OTHER"
  fi
}

# Clean HTML entities and tags
clean_html() {
  echo "$1" | sed -E 's/<[^>]+>//g' | sed 's/&nbsp;/ /g' | sed 's/&amp;/\&/g' | sed 's/&lt;/</g' | sed 's/&gt;/>/g' | sed "s/&#39;/'/g" | sed 's/&quot;/"/g' | tr '\n' ' ' | sed 's/  */ /g' | xargs
}

# Escape single quotes for SQL
escape_sql() {
  echo "$1" | sed "s/'/''/g"
}

# Start SQL file
cat > "$SQL_FILE" << 'SQLHEADER'
-- Kindred Collective Supplier Import
-- Generated from scraping kindredcollective.co.uk
-- Date: GENERATED_DATE

-- First, delete existing suppliers and related data
DELETE FROM "SavedSupplier";
DELETE FROM "Offer";
DELETE FROM "SupplierReview";
DELETE FROM "Supplier";

-- Insert scraped suppliers
SQLHEADER

# Replace date placeholder
sed -i "s/GENERATED_DATE/$(date -u +%Y-%m-%dT%H:%M:%SZ)/" "$SQL_FILE"

# Start JSON array
echo "[" > "$JSON_FILE"
first_entry=true

# Process each JSON file
count=0
for file in "$INPUT_DIR"/*.json; do
  # Extract data using jq-like parsing with python
  json_content=$(cat "$file")

  # Check if it's a valid product
  if ! echo "$json_content" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['product']['title'])" 2>/dev/null; then
    echo "Skipping $file - not a valid product"
    continue
  fi

  # Extract fields using python (since jq might not be available)
  title=$(echo "$json_content" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['product'].get('title',''))" 2>/dev/null)
  slug=$(echo "$json_content" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['product'].get('handle',''))" 2>/dev/null)
  body_html=$(echo "$json_content" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['product'].get('body_html','') or '')" 2>/dev/null)
  image_url=$(echo "$json_content" | python3 -c "import sys,json; d=json.load(sys.stdin); imgs=d['product'].get('images',[]); print(imgs[0]['src'] if imgs else d['product'].get('image',{}).get('src',''))" 2>/dev/null)

  # Clean description
  description=$(clean_html "$body_html")

  # Extract tagline (first sentence)
  tagline=$(echo "$description" | sed -E 's/([^.!?]+[.!?]).*/\1/' | head -c 150)

  # Determine category
  category=$(determine_category "$title $description")

  # Escape for SQL
  title_sql=$(escape_sql "$title")
  tagline_sql=$(escape_sql "$tagline")
  description_sql=$(escape_sql "$description")

  # Handle image URL
  if [ -n "$image_url" ] && [ "$image_url" != "" ]; then
    logo_sql="'$image_url'"
  else
    logo_sql="NULL"
  fi

  # Append to SQL file
  cat >> "$SQL_FILE" << SQLINSERT

INSERT INTO "Supplier" (
  id,
  "companyName",
  slug,
  tagline,
  description,
  category,
  services,
  "logoUrl",
  "isPublic",
  "isVerified",
  "claimStatus",
  "viewCount",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  '$title_sql',
  '$slug',
  '$tagline_sql',
  '$description_sql',
  '$category',
  '{}',
  $logo_sql,
  true,
  false,
  'UNCLAIMED',
  0,
  NOW(),
  NOW()
);
SQLINSERT

  # Append to JSON
  if [ "$first_entry" = true ]; then
    first_entry=false
  else
    echo "," >> "$JSON_FILE"
  fi

  cat >> "$JSON_FILE" << JSONENTRY
  {
    "companyName": "$title",
    "slug": "$slug",
    "tagline": "$tagline",
    "description": "$description",
    "category": "$category",
    "logoUrl": "$image_url"
  }
JSONENTRY

  echo "✅ $title [$category]"
  count=$((count + 1))
done

# Close JSON array
echo "]" >> "$JSON_FILE"

# Add footer to SQL
echo "" >> "$SQL_FILE"
echo "-- Done! Imported $count suppliers" >> "$SQL_FILE"

echo ""
echo "========================================="
echo "Total suppliers processed: $count"
echo "SQL file: $SQL_FILE"
echo "JSON file: $JSON_FILE"
echo "========================================="
