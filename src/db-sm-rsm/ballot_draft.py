import os
import concurrent.futures
import random
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from charm.toolbox.pairinggroup import PairingGroup, ZR, pair
from globals import group
import bbsig
import optpaillier
import optthpaillier
import secretsharing
import qrcode
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.utils import ImageReader
import hashlib
import uuid
import gmpy2
from gmpy2 import mpz
import pymongo
from misc import serialize_wrapper, deserialize_wrapper
import sys
from db import load,store
import zipfile
import logging
from time import sleep
import json
#import pyqrcode
#from pyzbar.pyzbar import decode

def make_serializable(obj):
    """Recursively convert crypto objects to strings/ints for JSON"""
    if isinstance(obj, list):
        return [make_serializable(x) for x in obj]
    if hasattr(obj, 'decode'): # Handle bytes if any
        return obj.decode('utf-8')
    try:
        # Try to use the provided serialize_wrapper
        return serialize_wrapper(obj)
    except:
        return str(obj)

def create_ballot_json(m, collection, filename, candidates, pai_sklist, pai_pk_optthpaillier, pai_sk, pai_pk, election_id, election_name):
    # 1. Run Crypto Logic (G1)
    gamma_booth = G2_part1(election_id)
    # Get Left QR Data List [bid, gamma, sigma]
    eps_v_w_ls, gamma_w_ls, evr_kw_ls, eps_r_w_ls, evr_rw_ls, bid, qr_data_booth = G1(gamma_booth, candidates, pai_pk_optthpaillier, pai_pk, m, election_id)
    
    # 2. Run Crypto Logic (G2)
    # Get Right QR Data List [ [hashes], [index, sigma] ]
    c_w_all, ov_hash, qr_data_updated = G2_part2(eps_v_w_ls, gamma_w_ls, evr_kw_ls, eps_r_w_ls, candidates, pai_pk_optthpaillier, pai_pk, m, bid, election_id)
    
    # 3. Save Receipt to DB (Required for backend verification)
    for i in range(len(candidates)):
        collection.insert_one({
            "election_id": election_id,
            "ov_hash": ov_hash,
            "enc_hash": c_w_all[i],
            "enc_msg": serialize_wrapper(eps_v_w_ls[i]),
            "comm": serialize_wrapper(gamma_w_ls[i]),
            "enc_msg_share": serialize_wrapper(evr_kw_ls[i]),
            "enc_rand_share": serialize_wrapper(evr_rw_ls[i]),
            "pfcomm": None,
            "enc_rand": serialize_wrapper(eps_r_w_ls[i]),
            "pf_encmsg": None,
            "pf_encrand": None,
            "pfs_enc_msg_share": None,
            "pfs_enc_rand_share": None,
            "accessed": False
        })

    # 4. Format Candidates List (WITH ROTATION)
    # i = The fixed number on the paper (0, 1, 2...)
    # y = The index of the candidate name (rotated by bid)
    candidates_list = []
    
    # Ensure bid is an integer for modulo math
    bid_int = int(bid) 
    
    for i in range(len(candidates)):
        v_w_bar = bid_int + i
        y = v_w_bar % len(candidates)
        
        cand_name = candidates[y]
        
        candidates_list.append({
            "candidate_number": str(i),   # Fixed Position on Paper (e.g., "0", "1")
            "serial_id": y,               # Original Index (Alice is always 0)
            "candidate_name": cand_name   # The Name appearing at this position
        })

    # 5. Prepare Clean Strings for JSON
    # Use clean_for_json to strip python wrappers, then json.dumps to stringify the list
    
    # Left QR: [bid, gamma, sigma]
    clean_left = clean_for_json(qr_data_booth)
    left_qr_string = json.dumps(clean_left) 
    
    # Right QR: [[hash1, hash2...], [index, sigma]]
    clean_right = clean_for_json(qr_data_updated)
    right_qr_string = json.dumps(clean_right)

    # 6. Construct Final JSON
    json_output = {
        "election_id": str(election_id),
        "election_name": election_name,
        
        # This will now look like "[['hash1', ...], [1, ['sig...']]]"
        "hash_string": right_qr_string, 
        
        "candidates": candidates_list,
        
        # Left-side QR string
        "ballot_id": left_qr_string
    }

    try:
        with open(filename, 'w') as f:
            json.dump(json_output, f, indent=4)
        print(f"JSON saved: {filename}")
        return True
    except Exception as e:
        print(f"Error saving JSON: {str(e)}")
        return False

def init():
    client = pymongo.MongoClient('mongodb://root:pass@eadb:27017')
    db = client["test"]
    return db

def clean_for_json(obj):
    """
    Recursively cleans crypto objects to simple Strings/Ints/Lists.
    Removes 'builtins.str', 'b'...', and other object wrappers.
    """
    if isinstance(obj, list) or isinstance(obj, tuple):
        return [clean_for_json(x) for x in obj]
    if isinstance(obj, bytes):
        return obj.decode('utf-8')
    if hasattr(obj, 'getAttribute'): # Handle some crypto objects
        return str(obj)
    # If it's a gmpy2 number or similar, convert to string/int
    try:
        return int(obj)
    except:
        return str(obj)

def connect_to_mongodb():
    # Connect to MongoDB
    client = pymongo.MongoClient('mongodb://root:pass@eadb:27017')
    # Create or use existing database
    db = client['test']
    # Create or use existing collection
    collection = db['receipts']
    return collection

def remove_non_alphabets(input_string):
    # Keep only alphabetic characters
    cleaned_string = ''
    for char in input_string:
        if char.isalpha():  # Check if the character is an alphabet
            cleaned_string += char
    return cleaned_string

def sha256_of_array(array):
    # Convert the array to a string representation
    array_string = str(array)
    # print("1")
    # print(array_string)
    # cleaned_string = remove_non_alphabets(array_string)
    
    # Encode the string to bytes
    array_bytes = array_string.encode('utf-8')
    # print("2")
    # print(array_bytes)
    # Compute the SHA-256 hash
    sha256_hash = hashlib.sha256(array_bytes).hexdigest()
    # print("3")
    # print(array_bytes)    
    return sha256_hash

def sha256_of_array2(array):
    # Concatenate the array elements into a single string
    array_string = ''.join(array)  # Joins ["a", "b", "c", "d"] into "abcd"
    print("Concatenated String:", array_string)
    
    # Encode the string to bytes
    array_bytes = array_string.encode('utf-8')
    print("Encoded Bytes:", array_bytes)
    
    # Compute the SHA-256 hash
    sha256_hash = hashlib.sha256(array_bytes).hexdigest()
    print("SHA-256 Hash:", sha256_hash)
    
    return sha256_hash

j = 1
#m = 2

def generate_qr_code(data, filename):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill='black', back_color='white')
    img.save(filename)


def create_pdf(m, collection, filename, candidates, pai_sklist, pai_pk_optthpaillier, pai_sk, pai_pk,election_id,election_name):
    # Call the functions to add content to both halves
    gamma_booth = G2_part1(election_id)
    print(gamma_booth)
    eps_v_w_ls, gamma_w_ls, evr_kw_ls, eps_r_w_ls,evr_rw_ls, bid = G1(gamma_booth, candidates, pai_pk_optthpaillier, pai_pk, m,election_id)
    print(eps_v_w_ls)
    c_w_all,ov_hash = G2_part2(eps_v_w_ls, gamma_w_ls, evr_kw_ls, eps_r_w_ls, candidates, pai_pk_optthpaillier, pai_pk, m, bid,election_id)
    print(ov_hash)
    for i in range(len(candidates)):
        collection.insert_one({
            "election_id":election_id,
            "ov_hash": ov_hash,
            "enc_hash": c_w_all[i],
            "enc_msg": serialize_wrapper(eps_v_w_ls[i]),
            "comm": serialize_wrapper(gamma_w_ls[i]),
            "enc_msg_share": serialize_wrapper(evr_kw_ls[i]),
            "enc_rand_share": serialize_wrapper(evr_rw_ls[i]),
            "pfcomm": None,
            "enc_rand": serialize_wrapper(eps_r_w_ls[i]),
            "pf_encmsg": None,
            "pf_encrand": None,
            "pfs_enc_msg_share": None,
            "pfs_enc_rand_share": None,
            "accessed":False
        })
    
    # Constants for A5 size in pixels (300 DPI)
    print("testing3")
    bw = 2480
    bh = 1748
    
    # Fonts
    font = ImageFont.truetype('DejaVuSans.ttf', 40)
    smallfont = ImageFont.truetype('DejaVuSans.ttf', 30)
    boldfont = ImageFont.truetype('DejaVuSans-Bold.ttf', 40)
    titlefont = ImageFont.truetype('DejaVuSans-Bold.ttf', 80)
    subtitlefont = ImageFont.truetype('DejaVuSans.ttf', 40)
    small_subtitlefont = ImageFont.truetype('DejaVuSans.ttf', 20)
    # Create a blank white image with A5 dimensions
    image = Image.new('RGB', (bw, bh), color='white')
    draw = ImageDraw.Draw(image)

    # Vertical line at the center
    center_x = bw // 2
    draw.line((center_x, 0, center_x, bh), fill='gray', width=10)

    # Headings
    election_text = f"Election ID: {election_id}"
    election_name_text=f"Election Name: {election_name}"
    # Left side (VVPAT side)
    election_id_x_left = int(0.2 * bw)  # Position near the start of the VVPAT side
    election_id_y = int(0.03 * bh)  # Slightly below the top margin
    draw.text((election_id_x_left, election_id_y), election_text, font=subtitlefont, fill='black')
    draw.text((election_id_x_left, election_id_y + 40), election_name_text, font=subtitlefont, fill='black')

    # Right side (Receipt side)
    election_id_x_right = center_x + int(0.2 * bw)  # Position near the start of the Receipt side
    draw.text((election_id_x_right, election_id_y), election_text, font=subtitlefont, fill='black')
    draw.text((election_id_x_right, election_id_y + 40), election_name_text, font=subtitlefont, fill='black')
    draw.text((election_id_x_left, 0.08 * bh), "VVPAT side", font=titlefont, fill='black')
    draw.text((election_id_x_left, 0.08 * bh + 100), "(Drop into the ballot box)", font=subtitlefont, fill='red')
    draw.text((election_id_x_left, 0.08 * bh + 150), "Mark your choice on BOTH sides", font=smallfont, fill='black')

    draw.text((election_id_x_right, 0.08 * bh), "Receipt side", font=titlefont, fill='black')
    draw.text((election_id_x_right, 0.08 * bh + 100), "(Bring back for scanning)", font=subtitlefont, fill='red')
    draw.text((election_id_x_right, 0.08 * bh + 150), "Take this side with you", font=smallfont, fill='black')

    # QR code containing encrypted votes
    qr_code2 = "qr_updated.png"
    qr_encvotes = Image.open(qr_code2)
    qr_encvotes = qr_encvotes.resize((600, 600))  # Resize if necessary
    encvotes_x = center_x + (bw // 4) - (qr_encvotes.width // 2) 
    encvotes_y = (bh - qr_encvotes.height) // 2
    draw.text((encvotes_x + 130, encvotes_y - 80), "Encrypted candidate IDs", font=boldfont, fill='black')
    draw.text((encvotes_x + 130, encvotes_y - 40), "(In the same order as the VVPAT side)", font=smallfont, fill='black')
    image.paste(qr_encvotes, (encvotes_x + 100, encvotes_y))
    print("testing4")
    # Candidate names
    text_x = int(0.3 * (bw // 2))  
    text_y = int(0.25 * bh) 
    candname_top = text_y
    box_startx = center_x - (encvotes_x - center_x)
    box_endx = encvotes_x - 50
    draw.text((text_x - 50, text_y - 100), "Candidates", font=boldfont, fill='black')
    draw.text((box_startx + 20, text_y - 100), "Your choice", font=boldfont, fill='black')
    draw.text((center_x + 20, text_y - 100), "Your choice", font=boldfont, fill='black')
    draw.text((center_x - (center_x - box_startx) // 2, text_y - 50), "(Mark across the line)", font=smallfont, fill='black')
    n = 0
    print("testing5")
    for i, candname in enumerate(candidates):
        n += 1
    
    for i in range(len(candidates)):
        v_w_bar = bid + i
        y = int(v_w_bar) % len(candidates)
        candname = candidates[y]
        draw.line((0, text_y, box_endx + 100, text_y), fill='gray', width=5)
        text_y = text_y + int(0.06 * bh *(6.5/n))
        draw.text((text_x, text_y - 0.008*bh), "%s. %s" % (i, candname), font=font, fill='black')
        draw.text((box_endx + 40, text_y - 0.008*bh), "%s." % i, font=font, fill='black')
        text_y = text_y + int(0.06 * bh *(4/n))
    draw.line((0, text_y, box_endx + 100, text_y), fill='gray', width=5)
    candname_bot = text_y
    draw.line((box_startx, candname_top, box_startx, candname_bot), fill='gray', width=5)
    #draw.line((box_endx, candname_top, box_endx, candname_bot), fill='gray', width=5)
    draw.line((box_endx + 100, candname_top, box_endx + 100, candname_bot), fill='gray', width=5)
    draw.text((box_startx + 30, candname_bot + 20), "(Separate along the line after marking)", font=smallfont, fill='black')
    draw.text((box_startx + 100, candname_bot + 50), "↓ Tear here after voting ↓", font=smallfont, fill='black')
    print("testing6")
    # QR code containing the bid
    qr_code = "qr_code.png"
    qr_bid = Image.open(qr_code)
    qr_bid = qr_bid.resize((250, 250))  # Resize if necessary
    bid_qr_x = int(0.05 * bw)
    bid_qr_y = int(0.03 * bh)
    image.paste(qr_bid, (bid_qr_x, bid_qr_y))

# "Ballot ID" text just right of QR code, vertically centered
    ballot_id_text_x = bid_qr_x + qr_bid.width
    ballot_id_text_y = bid_qr_y + qr_bid.height // 2 +10
    draw.text((ballot_id_text_x, ballot_id_text_y), "Ballot ID", font=small_subtitlefont, fill='black')
    print("testing7")
    # QR code containing the booth num
    # qr_code3 = "qr_code3.png"
    # qr_ballot_num = Image.open(qr_code3)
    # qr_ballot_num = qr_ballot_num.resize((300, 300))  # Resize if necessary
    # ballot_num_x = center_x + (bw // 4) - (qr_encvotes.width // 2) + 280 
    # ballot_num_y = text_y + 150
    # draw.text((ballot_num_x + 60, ballot_num_y - 50), "Booth Num", font=boldfont, fill='black')
    # image.paste(qr_ballot_num, (ballot_num_x, ballot_num_y))

    # Save the image
    print("testing1")
        # Attempt to save the file
    error = None
    result = None
    try:
        result = image.save(filename)
    except Exception as e:
        error = str(e)

    print(f"Image save result: {result}")
    if error:
        print("Error saving image:", error)
    print("testing2")
    
    # A4 dimensions in points (1 point = 1/72 inch)
    #width, height = A4
    
    # Create a new canvas object for the PDF
    #c = canvas.Canvas(filename, pagesize=A4)
    
    # Draw a line to divide the page vertically into two halves
    #c.line(width / 2, 0, width / 2, height)
    
    
    
    # Save the PDF
    #c.save()

def G1(gamma_booth, candidates, pai_pk_optthpaillier, pai_pk, m, election_id):
    # bid
    bid = group.random(ZR)
    g1, h1 = load("generators", ["g1", "h1"], election_id).values()
    
    # sigma_bid generation
    _sk = group.random(ZR)
    sigma_bid = g1**(1/(bid+_sk))
    
    # Prepare the exact list used for the "Left QR" (Ballot ID QR)
    qr_data_booth = [bid, gamma_booth, sigma_bid]
    
    eps_v_w_ls = []
    gamma_w_ls = []
    evr_kw_ls = []
    eps_r_w_ls = []
    evr_rw_ls = []

    for i, candidate in enumerate(candidates):
        v_w_bar = bid + i
        r_w = group.random(ZR)
        gamma_w = (g1**v_w_bar)*(h1**r_w)
        gamma_w_ls.append(gamma_w)
        
        epsilon_v_w_bar = optthpaillier.pai_encrypt(pai_pk_optthpaillier, v_w_bar)
        epsilon_r_w = optthpaillier.pai_encrypt(pai_pk_optthpaillier, r_w)
        eps_v_w_ls.append(epsilon_v_w_bar)
        eps_r_w_ls.append(epsilon_r_w)
        
        v_w_bar_k = secretsharing.share(v_w_bar, m)
        r_w_k = secretsharing.share(r_w, m)
        
        evr_kw_ls_sub2 = []
        evr_rw_ls_sub2 = []
        for j in range(m):
            ev_w_k = optpaillier.pai_encrypt(pai_pk[j], v_w_bar_k[j])
            er_w_k = optpaillier.pai_encrypt(pai_pk[j], r_w_k[j])
            
            # --- THE FIX IS HERE ---
            # We create the pair [EncryptedVoteShare, EncryptedRandomnessShare]
            evr_kw_ls_sub = [ev_w_k, er_w_k]
            
            # Append it to the first list
            evr_kw_ls_sub2.append(evr_kw_ls_sub)
            
            # Append THE SAME pair to the second list (or you can create a new one if logic requires)
            # Previously, you tried to append 'evr_rw_ls_sub' which was undefined.
            evr_rw_ls_sub2.append(evr_kw_ls_sub) 
            # -----------------------
        
        evr_kw_ls.append(evr_kw_ls_sub2)
        evr_rw_ls.append(evr_rw_ls_sub2)        

    # Return the QR list
    return eps_v_w_ls, gamma_w_ls, evr_kw_ls, eps_r_w_ls, evr_rw_ls, bid, qr_data_booth
        
def G2_part1(election_id):
    g1,h1=load("generators",["g1","h1"],election_id).values()
    r_booth = group.random(ZR)
    gamma_booth = (g1**j)*(h1**r_booth)
    return gamma_booth   

def G2_part2(eps_v_w_ls, gamma_w_ls, evr_kw_ls, eps_r_w_ls, candidates, pai_pk_optthpaillier, pai_pk, m, bid, election_id):
    g1, h1 = load("generators", ["g1", "h1"], election_id).values()
    c_w_hash = []
    c_w_all = []
    
    for i, candidate in enumerate(candidates):
        r_w_dash = group.random(ZR)
        gamma_w_dash = gamma_w_ls[i] * (h1 ** r_w_dash)
        
        epsilon_v_w_bar_dash = optthpaillier.pai_reencrypt(pai_pk_optthpaillier, eps_v_w_ls[i])
        epsilon_r_w_dash = optthpaillier.pai_reencrypt(pai_pk_optthpaillier, eps_r_w_ls[i])
        
        v_w_k_dash = secretsharing.share(0, m)
        r_w_k_dash = secretsharing.share(r_w_dash, m)
        
        c_w = []
        c_w.append(epsilon_v_w_bar_dash)
        c_w.append(gamma_w_dash)
        e_vr_w_k_dash_sub = []
        for j_idx in range(m):
            e_v_w_k_dash = optpaillier.pai_encrypt(pai_pk[j_idx], v_w_k_dash[j_idx])
            e_r_w_k_dash = optpaillier.pai_encrypt(pai_pk[j_idx], r_w_k_dash[j_idx])
            e_vr_w_k_dash_sub.append([e_v_w_k_dash, e_r_w_k_dash])
        
        c_w.append(e_vr_w_k_dash_sub)
        c_w.append(epsilon_r_w_dash)
        
        c_w_h = sha256_of_array(c_w)
        c_w_hash.append(c_w)
        c_w_all.append(c_w_h)

    _sk = group.random(ZR)
    ov_hash = sha256_of_array2(c_w_all)
    
    # Prepare the QR Payload (Right Side QR)
    # Structure: [ [hash1, hash2...], [index, sigma_c] ]
    c_w_all_updated = [x for x in c_w_all]
    
    has = group.hash(c_w_hash, type=ZR)
    sigma_c = bbsig.bbsign(has, _sk, election_id)
    
    j_val = 1 
    qr_data3 = [j_val, sigma_c]
    
    qr_data_updated = [c_w_all_updated, qr_data3]
    
    return c_w_all, ov_hash, qr_data_updated

def create_pdf_worker(args):
    index, collection, filename, candidates, pai_sklist, pai_pk_optthpaillier, pai_sk, pai_pk,election_id = args
    create_pdf(collection, filename, candidates, pai_sklist, pai_pk_optthpaillier, pai_sk, pai_pk,election_id)
    
def load2(election_id):
    db = init()
    collection=db['keys']
    document=collection.find_one({"election_id":election_id})
    params = ["alpha", "pai_pklist_single", "_pai_sklist_single", "_pai_sklist", "pai_pk"]
    result = {}
    params2 = ["m", "pai_pk", "pai_sk", "pai_sklist", "pai_pk_optthpaillier"]
    for i in range(0, 5):
        result[params2[i]] = deserialize_wrapper(document[params[i]])
    return result

def ballot_draft(num, election_id):
    # Initialize logging
    logger = logging.getLogger(f"Election_{election_id}")
    logger.setLevel(logging.INFO)
    handler = logging.FileHandler(f"election_{election_id}.log")
    logger.addHandler(handler)
    
    try:
        logger.info(f"Starting ballot generation for Election {election_id}")
        ballots_generated = 0
        
        db = init()
        collect = db['candidates']
        
        # Get candidates
        candidates = []
        election_name = "Unknown Election"
        documents = collect.find({"election_id": election_id})
        for document in documents:
            candidates.append(document["name"])
            if election_name == "Unknown Election":
                election_name = document.get("election_name", "Unknown Election") # Safer get

        # Load Keys
        m, pai_pk, pai_sk, pai_sklist, pai_pk_optthpaillier = load2(election_id).values()
        collection = connect_to_mongodb()
        
        output_dir = "/output"
        
        for i in range(num):
            # Change filename to .json
            json_filename = f"election_id_{election_id}_ballot_{i+1}.json"
            json_path = os.path.join(output_dir, json_filename)
            
            # Call the new JSON function instead of create_pdf
            create_ballot_json(m, collection, json_path, candidates, pai_sklist, pai_pk_optthpaillier, pai_sk, pai_pk, election_id, election_name)
            
            if os.path.exists(json_path):
                print(f"Ballot Data {json_filename} created successfully!")
            
            sleep(0.01)
            ballots_generated += 1
            
        logger.info(f"Success: {ballots_generated}/{num} ballots for Election {election_id}")

    except Exception as e:
        logger.error(f"Failed: {str(e)}")
        print(f"Error: {str(e)}") # Print to console as well
    finally:
        handler.close()
        logger.removeHandler(handler)

if __name__ == "__main__":
    import sys
    # This block allows the script to be run from the command line
    # Usage: python ballot_draft.py <number_of_ballots> <election_id>
    try:
        if len(sys.argv) < 3:
            print("Usage: python ballot_draft.py <num> <electionId>")
            sys.exit(1)
            
        num = int(sys.argv[1])
        election_id = int(sys.argv[2])
        
        # Call the main function
        ballot_draft(num, election_id)
        
    except (IndexError, ValueError) as e:
        print(f"Error: Invalid arguments. {str(e)}")
        sys.exit(1)