import os
import re

def replace_base_url_in_files(file_list, old_base_url, new_base_url):
    for filepath in file_list:
        abs_filepath = os.path.join(os.path.dirname(__file__), filepath)
        
        with open(abs_filepath, 'r') as f:
            content = f.read()
        
        new_content = re.sub(r'(?<=\bfetch\(")' + re.escape(old_base_url) + r'(?=/)', new_base_url, content)
        
        with open(abs_filepath, 'w') as f:
            f.write(new_content)

def update_url_in_txt(new_url, txt_file):
    abs_txt_file = os.path.join(os.path.dirname(__file__), txt_file)
    
    with open(abs_txt_file, 'r') as f:
        # Read all URLs from the text file
        urls = f.readlines()
        
        # Extract the last URL as the old URL
        old_url = urls[-1].strip() if urls else ""
        
        # Remove the old URL from the list
        urls.pop() if urls else None
    
    with open(abs_txt_file, 'w') as f:
        # Write back the updated URLs (without the old URL)
        f.writelines(urls)
    
    with open(abs_txt_file, 'a') as f:
        # Append the new URL to the text file
        f.write(new_url + '\n')

    return old_url

if __name__ == "__main__":
    files = [
        r"screens/ScanPref.js"
    ]
    
    new_url = input("Enter the new base URL: ")
    txt_file = "urls.txt"

    old_url = update_url_in_txt(new_url, txt_file)

    replace_base_url_in_files(files, old_url, new_url)
    print("Base URLs replaced successfully.")











