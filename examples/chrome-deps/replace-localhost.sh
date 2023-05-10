#!bash

# Define the green color for output
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Check if the IP address argument is provided
if [ -z "$1" ]
  then
    echo "No IP address argument provided"
    exit 1
fi

# Loop through all files in the current directory
for file in *
do
  # Check if the file is a regular file (not a directory) and not the script itself
  if [ -f "$file" ] && [ "$file" != "replace-localhost.sh" ]
    then
      # Replace "localhost" with the specified IP address in the file
      if grep -q "localhost" "$file"; then
        sed -i "s/localhost/$1/g" "$file"
        echo "Replaced localhost with $1 in file $file"
        # Print the name of the file and line number for each line that was replaced
        grep -n "$1" "$file" | while read -r line ; do
          lineNumber=$(echo $line | cut -f1 -d:)
          lineContent=$(echo $line | cut -f2- -d:)
          echo -e "${GREEN}[$file:$lineNumber]${NC} $lineContent"
        done
      else
        echo "No changes made to file $file"
      fi
  fi
done
