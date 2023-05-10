#!bash

# Define the green color for output
GREEN='\033[0;32m'
NC='\033[0m' # No Color
GREY='\033[0;30m'
# Check if the IP address argument is provided
if [ -z "$1" ] || [ -z "$2" ]
  then
    echo "No IP address & server arguments provided"
    exit 1
fi

# Loop through all files in the current directory
for file in *
do
  # Check if the file is a regular file (not a directory) and not the script itself
  if [ -f "$file" ] && [ "$file" != "replace-server-address.sh" ]
    then
      if grep -q "$1" "$file"; then
        sed -i "s/$1/$2/g" "$file"
        echo "Replaced $1 with $2 in file $file"
        # Print the name of the file and line number for each line that was replaced
        grep -n "$2" "$file" | while read -r line ; do
          lineNumber=$(echo $line | cut -f1 -d:)
          lineContent=$(echo $line | cut -f2- -d:)
          echo -e "${GREEN}[$file:$lineNumber]${NC} $lineContent"
        done
      else
        echo -e "${GREY}No changes made to file${NC} $file"
      fi
  fi
done
