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
#import pyqrcode
#from pyzbar.pyzbar import decode


def init():
    client = pymongo.MongoClient('mongodb://root:pass@eadb:27017')
    db = client["test"]
    return db

def connect_to_mongodb():
    # Connect to MongoDB
    client = pymongo.MongoClient('mongodb://root:pass@eadb:27017')
    # Create or use existing database
    db = client['test']
    # Create or use existing collection
    collection = db['receipts']
    return collection

def sha256_of_array(array):
    # Convert the array to a string representation
    array_string = str(array)
    
    # Encode the string to bytes
    array_bytes = array_string.encode('utf-8')
    
    # Compute the SHA-256 hash
    sha256_hash = hashlib.sha256(array_bytes).hexdigest()
    
    return sha256_hash

# Initialize the pairing group
#group = PairingGroup('SS512')

# Define g and h using the pairing group

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


def create_pdf(m, collection, filename, candidates, pai_sklist, pai_pk_optthpaillier, pai_sk, pai_pk):
    # Call the functions to add content to both halves
    gamma_booth = G2_part1()
    print(gamma_booth)
    eps_v_w_ls, gamma_w_ls, evr_kw_ls, eps_r_w_ls,evr_rw_ls, bid = G1(gamma_booth, candidates, pai_pk_optthpaillier, pai_pk, m)
    print(eps_v_w_ls)
    c_w_all,ov_hash = G2_part2(eps_v_w_ls, gamma_w_ls, evr_kw_ls, eps_r_w_ls, candidates, pai_pk_optthpaillier, pai_pk, m, bid)
    print(ov_hash)
    for i in range(len(candidates)):
        collection.insert_one({
            'ov_hash': ov_hash,
            'enc_hash': c_w_all[i],
            'enc_msg': serialize_wrapper(eps_v_w_ls[i]),
            'comm': serialize_wrapper(gamma_w_ls[i]),
            'enc_msg_share': serialize_wrapper(evr_kw_ls[i]),
            'enc_rand_share': serialize_wrapper(evr_rw_ls[i]),
            'pfcomm': None,
            'enc_rand': serialize_wrapper(eps_r_w_ls),
            'pf_encmsg': None,
            'pf_encrand': None,
            'pfs_enc_msg_share': None,
            'pfs_enc_rand_share': None
        })
    
    # Constants for A5 size in pixels (300 DPI)
    bw = 2480
    bh = 1748
    
    # Fonts
    font = ImageFont.truetype('DejaVuSans.ttf', 40)
    smallfont = ImageFont.truetype('DejaVuSans.ttf', 30)
    boldfont = ImageFont.truetype('DejaVuSans-Bold.ttf', 40)
    titlefont = ImageFont.truetype('DejaVuSans-Bold.ttf', 80)
    subtitlefont = ImageFont.truetype('DejaVuSans.ttf', 40)

    # Create a blank white image with A5 dimensions
    image = Image.new('RGB', (bw, bh), color='white')
    draw = ImageDraw.Draw(image)

    # Vertical line at the center
    center_x = bw // 2
    draw.line((center_x, 0, center_x, bh), fill='gray', width=10)

    # Headings
    draw.text((int(0.2 * bh), 0.07 * bh), "VVPAT side", font=titlefont, fill='black')
    draw.text((int(0.2 * bh), 0.07 * bh + 100), "(Drop into the ballot box)", font=subtitlefont, fill='black')
    draw.text((center_x + int(0.2 * bh), 0.07 * bh), "Receipt side", font=titlefont, fill='black')
    draw.text((center_x + int(0.2 * bh), 0.07 * bh + 100), "(Bring back for scanning)", font=subtitlefont, fill='black')

    # QR code containing encrypted votes
    qr_code2 = "qr_code.png"
    qr_encvotes = Image.open(qr_code2)
    qr_encvotes = qr_encvotes.resize((600, 600))  # Resize if necessary
    encvotes_x = center_x + (bw // 4) - (qr_encvotes.width // 2) 
    encvotes_y = (bh - qr_encvotes.height) // 2
    draw.text((encvotes_x + 130, encvotes_y - 80), "Encrypted candidate IDs", font=boldfont, fill='black')
    draw.text((encvotes_x + 130, encvotes_y - 40), "(In the same order as the VVPAT side)", font=smallfont, fill='black')
    image.paste(qr_encvotes, (encvotes_x + 100, encvotes_y))

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
    for i, candname in enumerate(candidates):
        n += 1
    
    for i, candname in enumerate(candidates):
        draw.line((0, text_y, box_endx + 100, text_y), fill='gray', width=5)
        text_y = text_y + int(0.06 * bh *(4/n))
        draw.text((text_x, text_y - 0.008*bh), "%s. %s" % (i, candname), font=font, fill='black')
        draw.text((box_endx + 40, text_y - 0.008*bh), "%s." % i, font=font, fill='black')
        text_y = text_y + int(0.06 * bh *(4/n))
    draw.line((0, text_y, box_endx + 100, text_y), fill='gray', width=5)
    candname_bot = text_y
    draw.line((box_startx, candname_top, box_startx, candname_bot), fill='gray', width=5)
    #draw.line((box_endx, candname_top, box_endx, candname_bot), fill='gray', width=5)
    draw.line((box_endx + 100, candname_top, box_endx + 100, candname_bot), fill='gray', width=5)
    draw.text((box_startx + 30, candname_bot + 20), "(Separate along the line after marking)", font=smallfont, fill='black')

    # QR code containing the bid
    qr_code = "qr_code.png"
    qr_bid = Image.open(qr_code)
    qr_bid = qr_bid.resize((300, 300))  # Resize if necessary
    bid_x = text_x
    bid_y = text_y + 150
    draw.text((bid_x + 60, bid_y - 50), "Ballot ID", font=boldfont, fill='black')
    image.paste(qr_bid, (bid_x, bid_y))

    # QR code containing the booth num
    qr_code3 = "qr_code3.png"
    qr_ballot_num = Image.open(qr_code3)
    qr_ballot_num = qr_ballot_num.resize((300, 300))  # Resize if necessary
    ballot_num_x = center_x + (bw // 4) - (qr_encvotes.width // 2) + 280 
    ballot_num_y = text_y + 150
    draw.text((ballot_num_x + 60, ballot_num_y - 50), "Booth Num", font=boldfont, fill='black')
    image.paste(qr_ballot_num, (ballot_num_x, ballot_num_y))

    # Save the image
    image.save(filename)

    
    # A4 dimensions in points (1 point = 1/72 inch)
    #width, height = A4
    
    # Create a new canvas object for the PDF
    #c = canvas.Canvas(filename, pagesize=A4)
    
    # Draw a line to divide the page vertically into two halves
    #c.line(width / 2, 0, width / 2, height)
    
    
    
    # Save the PDF
    #c.save()

def G1(gamma_booth, candidates, pai_pk_optthpaillier, pai_pk, m):
    # bid
    bid = group.random(ZR)
    g1,h1=load("generators",["g1","h1"]).values()
    # sigma_bid generation
    _sk = group.random(ZR)
    sigma_bid = g1**(1/(bid+_sk))
    
    # qrcode
    qr_data = []
    qr_data.append(bid)
    qr_data.append(gamma_booth)
    qr_data.append(sigma_bid)
    qr_filename = "qr_code.png"
    generate_qr_code(qr_data, qr_filename)
    
    # Set the font and size for the left half
    #c.setFont("Helvetica", 16)
    
    # Set the starting position for the left half
    #left_x = 20
    #left_y = height - 160
    
    # Titles for the left half
    #c.drawString(left_x + 40, left_y - 10, "w")
    
    #c.drawString(left_x + 150, left_y - 10, "Candidate")
    #c.drawString(left_x + 390, left_y - 60, "Scan Commitments")
    #c.drawString(left_x + 110, left_y - 10 - 400, "Scan bid")
    #c.drawString(left_x + 400, left_y - 10 - 400, "Scan booth num")
    #c.line(left_x, left_y - 8 - 10, left_x + 150 + 100, left_y - 8 - 10)  # Underline 'Candidate'
    
    # Calculate center position for candidate names
    #candidate_x_center = left_x + 180
    
    # Print each candidate's number and name on the left half
    k = 0
    
    eps_v_w_ls = []
    gamma_w_ls = []
    evr_kw_ls = []
    eps_r_w_ls = []
    evr_rw_ls=[]

    n = 0
    for i, candidate in enumerate(candidates):
        n += 1

    for i, candidate in enumerate(candidates):
        # v_w_bar
        v_w_bar = bid + i
        
        # r_w
        r_w = group.random(ZR)
        
        # gamma_w
        gamma_w = (g1**v_w_bar)*(h1**r_w)
        gamma_w_ls.append(gamma_w)
        
        # Step 7
        alpha = len(candidates)
        
        epsilon_v_w_bar = optthpaillier.pai_encrypt(pai_pk_optthpaillier, v_w_bar)
        epsilon_r_w = optthpaillier.pai_encrypt(pai_pk_optthpaillier, r_w)
        eps_v_w_ls.append(epsilon_v_w_bar)
        eps_r_w_ls.append(epsilon_r_w)
        
        # Step 8
        v_w_bar_k = secretsharing.share(v_w_bar, m)
        r_w_k = secretsharing.share(r_w, m)
        
        # Step 9
        evr_kw_ls_sub2 = []
        evr_rw_ls_sub2=[]
        for j in range(m):
            ev_w_k = optpaillier.pai_encrypt(pai_pk[j], v_w_bar_k[j])
            er_w_k = optpaillier.pai_encrypt(pai_pk[j], r_w_k[j])
            evr_kw_ls_sub = []
            evr_rw_ls_sub=[]
            evr_kw_ls_sub.append(ev_w_k)
            evr_rw_ls_sub.append(er_w_k)
            evr_kw_ls_sub2.append(evr_kw_ls_sub)
            evr_rw_ls_sub2.append(evr_rw_ls_sub)
        evr_kw_ls.append(evr_kw_ls_sub2)
        evr_rw_ls.append(evr_rw_ls_sub2)        
        k = i
        step = 300/n
        #c.drawString(left_x + 40, left_y - step * (i + 1) - 10, f"{i}")
        
        # Calculate the width of the candidate name
        #candidate_width = c.stringWidth(candidate, "Helvetica", 14)
        
        # Calculate the position to start drawing the candidate name
        #candidate_x = candidate_x_center - candidate_width / 2
        
        # candidate's index
        y = int(v_w_bar) % len(candidates)  # Convert v_w_bar to int before using modulus
        candidate = candidates[y]
        
        #c.drawString(candidate_x, left_y - 60 * (i + 1) - 10, f"{candidate}")

    #qr_image = ImageReader(qr_filename)
    #qr_x = width / 2 - 100  # Adjust the position as needed
    #qr_y = left_y - 60 * (k + 4)
    #c.drawImage(qr_image, left_x + 40, left_y - 60*(k+6) - 10, width=200, height=200)

    #c.line(left_x, left_y - 60*(k+2) - 10, left_x + 150 + 100, left_y - 60*(k+2) - 10)
    
    return eps_v_w_ls, gamma_w_ls, evr_kw_ls, eps_r_w_ls,evr_rw_ls, bid
    
def G2_part1():
    g1,h1=load("generators",["g1","h1"]).values()
    r_booth = group.random(ZR)
    gamma_booth = (g1**j)*(h1**r_booth)
    return gamma_booth   

def G2_part2(eps_v_w_ls, gamma_w_ls, evr_kw_ls, eps_r_w_ls, candidates, pai_pk_optthpaillier, pai_pk, m, bid):
    # Set the font and size for the right half
    #c.setFont("Helvetica", 16)
    
    # Set the starting position for the right half
    #right_x = width / 2 + 20
    #right_y = height - 160
    
    # Titles for the right half
    #c.drawString(right_x + 40, right_y - 10, "w")
    
    #c.drawString(right_x + 150, right_y - 10, "Candidate")
    #c.line(right_x + 40, right_y - 8 - 10, right_x + 150 + 100, right_y - 8 - 10)  # Underline 'Candidate'
    
    # Calculate center position for candidate names
    #candidate_x_center = right_x + 180
    
    # Print each candidate's number and name on the right half
    g1,h1=load("generators",["g1","h1"]).values()
    k = 0
    c_w_hash = []
    c_w_all = []
    c_w_original = []
    for i, candidate in enumerate(candidates):
        # Step 14
        r_w_dash = group.random(ZR)
        gamma_w_dash = gamma_w_ls[i] * (h1**r_w_dash)
        
        # Step 15
        alpha = len(candidates)
        
        epsilon_v_w_bar_dash = optthpaillier.pai_encrypt(pai_pk_optthpaillier, eps_v_w_ls[i])
        epsilon_r_w_dash = optthpaillier.pai_encrypt(pai_pk_optthpaillier, eps_r_w_ls[i])
        
        # Step 16
        v_w_k_dash = secretsharing.share(0, m)
        r_w_k_dash = secretsharing.share(r_w_dash, m)
        
        # Step 17
        c_w = []
        c_w.append(epsilon_v_w_bar_dash)
        c_w.append(gamma_w_dash)
        e_vr_w_k_dash_sub = []
        for j in range(m):
            e_v_w_k_dash = optpaillier.pai_encrypt(pai_pk[j], v_w_k_dash[j])
        
            # Step 18
            e_r_w_k_dash = optpaillier.pai_encrypt(pai_pk[j], r_w_k_dash[j])
            e_vr_w_k_dash = []
            e_vr_w_k_dash.append(e_v_w_k_dash)
            e_vr_w_k_dash.append(e_r_w_k_dash)
            e_vr_w_k_dash_sub.append(e_vr_w_k_dash)
        
        # Step 19
        c_w.append(e_vr_w_k_dash_sub)
        c_w.append(epsilon_r_w_dash)
        c_w_original.append(c_w)
        c_w_h = sha256_of_array(c_w)
        c_w_hash.append(c_w)
        c_w_all.append(c_w_h)
        
        k = i
        #c.drawString(right_x + 40, right_y - 60 * (i + 1) - 10, f"{i}")
        
        # Calculate the width of the candidate name
        #candidate_width = c.stringWidth(candidate, "Helvetica", 14)
        
        # Calculate the position to start drawing the candidate name
        #candidate_x = candidate_x_center - candidate_width / 2
        
    _sk = group.random(ZR)
    ov_hash = sha256_of_array(c_w_all)
    commitment_identifier = str(uuid.uuid4())
    
    c_w_all_updated = []
    for i, candidate in enumerate(candidates):
        v_w_bar = bid + i
        y = int(v_w_bar) % len(candidates)
        c_w_all_i = c_w_all[y]
        c_w_all_updated.append(c_w_all_i)
    qr_data = c_w_all_updated
    print(qr_data)
    qr_filename2 = "qr_code2.png"
    generate_qr_code(qr_data, qr_filename2)
    #qr_image2 = ImageReader(qr_filename2)
    #c.drawImage(qr_image2, right_x + 60, right_y - 270, width=200, height=200)
    
    has = group.hash(c_w_hash, type=ZR)
    sigma_c = bbsig.bbsign(has, _sk)
    qr_data3 = []
    qr_data3.append(j)
    qr_data3.append(sigma_c)
    qr_filename3 = "qr_code3.png"
    generate_qr_code(qr_data3, qr_filename3)
    qr_image3 = ImageReader(qr_filename3)
    #c.drawImage(qr_image3, right_x + 60, right_y - 60*(k+6) - 10, width=200, height=200)

    #c.line(right_x + 40, right_y - 60*(k+2) - 10, right_x + 150 + 100, right_y - 60*(k+2) - 10)
    #c.line(width/2, right_y - 60*(k+7) - 10, width, right_y - 60*(k+7) - 10)
    
    return c_w_all,ov_hash

def create_pdf_worker(args):
    index, collection, filename, candidates, pai_sklist, pai_pk_optthpaillier, pai_sk, pai_pk = args
    create_pdf(collection, filename, candidates, pai_sklist, pai_pk_optthpaillier, pai_sk, pai_pk)
    
def load2():
    db = init()
    collection=db['keys']
    document=collection.find_one()
    params = ["alpha", "pai_pklist_single", "_pai_sklist_single", "_pai_sklist", "pai_pk"]
    result = {}
    params2 = ["m", "pai_pk", "pai_sk", "pai_sklist", "pai_pk_optthpaillier"]
    for i in range(0, 5):
        result[params2[i]] = deserialize_wrapper(document[params[i]])
    return result

def ballot_draft(num):
    num_ballots = num

    db=init()
    collect=db['candidates']
    # Get the candidate names
    candidates = []
    documents=collect.find()
    for document in documents:
        candidates.append(document["name"])    
    #pai_sklist, pai_pk_optthpaillier = optthpaillier.pai_th_keygen(len(candidates))
    #pai_sk, pai_pk = optpaillier.pai_keygen()
    # Connect to MongoDB
    m, pai_pk, pai_sk, pai_sklist, pai_pk_optthpaillier = load2().values()
    
    #print("a")
    #print(m)
    #print("b")
    #print(pai_pk)
    #print("c")
    #print(pai_sk)
    #m = 2
    #print(m)
    #print(pai_sklist)
    collection = connect_to_mongodb()

    for i in range(num_ballots):
        print(f"Creating PDF for ballot {i+1}...")
        create_pdf(m, collection, f"ballot_{i+1}.pdf", candidates, pai_sklist, pai_pk_optthpaillier, pai_sk, pai_pk)
        print(f"PDF ballot_{i+1}.pdf created successfully!")
        if os.path.exists(f"ballot_{i+1}.pdf"): 
            print(f"ballot_{i+1}.pdf saved successfully.")
        else:
            print(f"Failed to save ballot_{i+1}.pdf!")

    # Prepare arguments for threading
    #args_list = [(i, m, collection, f"ballot_{i+1}.pdf", candidates, pai_sklist, pai_pk_optthpaillier, pai_sk, pai_pk) for i in range(num_ballots)]

    # Use ThreadPoolExecutor for concurrent execution
    #with concurrent.futures.ThreadPoolExecutor() as executor:
    #    executor.map(create_pdf_worker, args_list)

