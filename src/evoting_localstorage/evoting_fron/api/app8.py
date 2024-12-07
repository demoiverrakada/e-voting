from flask import Flask, render_template, Response
import cv2
import numpy as np
from PIL import Image
from pyzbar.pyzbar import decode
import sys
#from ecdsa import SECP256k1 as CF

widthImg = 490
heightImg = 528
questions = 1
choices = 4
ans = [1,2,0,1,4]
webcamFeed = True

app = Flask(__name__)

camera = cv2.VideoCapture(0)
camera.set(10, 150)



if len(sys.argv) < 2:
    print("Usage: python script.py <image_path>")
    sys.exit(1)

path = sys.argv[1]

def read_qr_code(image_path):
    # Read the image
    image = cv2.imread(image_path)

    # Convert the image to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Use the decode function to find and decode QR codes
    qr_codes = decode(gray)

    # Iterate through all the QR codes found
    for qr_code in qr_codes:
        # Extract the data from the QR code
        data = qr_code.data.decode('utf-8')

        # Print the data and location of the QR code
        print(f"QR Code Data: {data}")
        #print(f"QR Code Location: {qr_code.polygon}")

        # Draw a rectangle around the QR code
        # rect_points = qr_code.polygon
        # if len(rect_points) == 4:
        #     rect_points = [(point.x, point.y) for point in rect_points]
        #     rect_points = [(int(x), int(y)) for x, y in rect_points]
        #     cv2.polylines(image, [rect_points], isClosed=True, color=(0, 255, 0), thickness=2)

    # Display the image with rectangles drawn around QR codes
    # cv2.imshow("QR Code Reader", image)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

def stackImages(imgArray,scale,lables=[]):
    rows = len(imgArray)
    cols = len(imgArray[0])
    rowsAvailable = isinstance(imgArray[0], list)
    width = imgArray[0][0].shape[1]
    height = imgArray[0][0].shape[0]
    if rowsAvailable:
        for x in range ( 0, rows):
            for y in range(0, cols):
                imgArray[x][y] = cv2.resize(imgArray[x][y], (0, 0), None, scale, scale)
                if len(imgArray[x][y].shape) == 2: imgArray[x][y]= cv2.cvtColor( imgArray[x][y], cv2.COLOR_GRAY2BGR)
        imageBlank = np.zeros((height, width, 3), np.uint8)
        hor = [imageBlank]*rows
        hor_con = [imageBlank]*rows
        for x in range(0, rows):
            hor[x] = np.hstack(imgArray[x])
            hor_con[x] = np.concatenate(imgArray[x])
        ver = np.vstack(hor)
        ver_con = np.concatenate(hor)
    else:
        for x in range(0, rows):
            imgArray[x] = cv2.resize(imgArray[x], (0, 0), None, scale, scale)
            if len(imgArray[x].shape) == 2: imgArray[x] = cv2.cvtColor(imgArray[x], cv2.COLOR_GRAY2BGR)
        hor= np.hstack(imgArray)
        hor_con= np.concatenate(imgArray)
        ver = hor
    if len(lables) != 0:
        eachImgWidth= int(ver.shape[1] / cols)
        eachImgHeight = int(ver.shape[0] / rows)
        #print(eachImgHeight)
        for d in range(0, rows):
            for c in range (0,cols):
                cv2.rectangle(ver,(c*eachImgWidth,eachImgHeight*d),(c*eachImgWidth+len(lables[d][c])*13+27,30+eachImgHeight*d),(255,255,255),cv2.FILLED)
                cv2.putText(ver,lables[d][c],(eachImgWidth*c+10,eachImgHeight*d+20),cv2.FONT_HERSHEY_COMPLEX,0.7,(255,0,255),2)
    return ver

def rectCountour(coutours):

    rectCon = []
    for i in coutours:
        area = cv2.contourArea(i)
        #print("Area",area)
        if area > 50:
            peri = cv2.arcLength(i,True)
            approx = cv2.approxPolyDP(i,0.02*peri,True)
            #print("Corner Points", len(approx))
            if len(approx) == 4:
                rectCon.append(i)
    rectCon = sorted(rectCon,key=cv2.contourArea,reverse=True)

    return rectCon

def getCornerPoints(cont):
    peri = cv2.arcLength(cont, True)
    approx = cv2.approxPolyDP(cont, 0.02*peri, True)
    return approx

def reorder(myPoints):

    myPoints = myPoints.reshape((4,2))
    myPointsNew = np.zeros((4,1,2),np.int32)
    add = myPoints.sum(1)
    #print(myPoints)
    #print(add)
    myPointsNew[0] = myPoints[np.argmin(add)]
    myPointsNew[3] = myPoints[np.argmax(add)]
    diff = np.diff(myPoints,axis=1)
    myPointsNew[1] = myPoints[np.argmin(diff)]
    myPointsNew[2] = myPoints[np.argmax(diff)]
    #print(diff)

    return myPointsNew

def splitBoxes(img):
    rows = np.vsplit(img, 3)
    #cv2.imshow("Split", rows[1])
    boxes = []

    # for x in range(0,27):
    #     if (x%3 != 0):


    
    # boxes = []

    for x in range(0, 3):
        if(x%3 != 0):
            r = rows[x]
            cols = np.hsplit(r, 2)
            for box in cols:
                boxes.append(box)
    
    # for r in rows:
    #     cols = np.hsplit(r, 2)
    #     for box in cols:
    #         boxes.append(box)
    #         cv2.imshow("Split",box)
    cv2.imshow("Split", boxes[2])
    return boxes
    
    #cv2.imshow("Split", boxes[6])
    #cv2.imshow("Split", boxes[10])
    #cv2.imshow("Split", boxes[8])
    #cv2.imshow("Split", boxes[9])

def showAnswers(img, myIndex, grading, ans, questions, choices):
    secW = int(img.shape[1]/questions)
    secH = int(img.shape[0]/choices)

    for x in range(0, questions):
        myAns = myIndex[x]
        cX = (myAns*secW) + secW//2
        cY = (x*secH) + secH//2

        if grading[x] == 1:
            myColor = (0,255,0)
        else:
            myColor = (0,0,255)
            correctAns = ans[x]
            cv2.circle(img, ((correctAns*secW)+secW//2,(x*secH)+secH//2), 20, (0,255,0), cv2.FILLED)

        cv2.circle(img,(cX,cY),50,myColor,cv2.FILLED)

    return img

img = cv2.imread(path)

img = cv2.resize(img,(widthImg,heightImg))
imgContours= img.copy()
imgGray = cv2.cvtColor(img,cv2.COLOR_BGR2GRAY)
imgBlur = cv2.GaussianBlur(imgGray,(5,5),1)
imgCanny = cv2.Canny(imgBlur,100,100)
imgBiggestContours = img.copy()


contours, heirarchy = cv2.findContours(imgCanny, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
cv2.drawContours(imgContours, contours, -1, (0,255,0), 10)


rectCon = rectCountour(contours)
biggestContour =getCornerPoints(rectCon[0])
secondbiggestContour = getCornerPoints(rectCon[1])


if biggestContour.size != 0 and secondbiggestContour.size != 0:
    cv2.drawContours(imgBiggestContours, biggestContour, -1, (0, 255, 0), 20)
    cv2.drawContours(imgBiggestContours, secondbiggestContour, -1, (255, 0, 0), 20)

    biggestContour = reorder(biggestContour)
    secondbiggestContour = reorder(secondbiggestContour)

    pt1 = np.float32(biggestContour)
    pt2 = np.float32([[0,0],[widthImg,0],[0,heightImg],[widthImg,heightImg]])
    matrix = cv2.getPerspectiveTransform(pt1, pt2)
    imgWarpColored = cv2.warpPerspective(img, matrix, (widthImg, heightImg))

    ptG1 = np.float32(secondbiggestContour)
    ptG2 = np.float32([[0,0],[200,0],[0,200],[200,200]])
    matrixG = cv2.getPerspectiveTransform(ptG1, ptG2)
    imgQRColored = cv2.warpPerspective(img, matrixG, (200,200))
    #cv2.imshow("QR", imgQRColored)

    imgWarpGray = cv2.cvtColor(imgWarpColored, cv2.COLOR_BGR2GRAY)
    imgThresh = cv2.threshold(imgWarpGray, 110, 255, cv2.THRESH_BINARY_INV)[1]

    boxes = splitBoxes(imgThresh)

    myPixelVal = np.zeros((questions, choices))
    countC = 0
    countR = 0

    for image in boxes:
        totalPixels = cv2.countNonZero(image)
        myPixelVal[countR][countC] = totalPixels
        countC +=1
        if (countC == choices): countR += 1 ; countC = 0
    print(myPixelVal)

    myIndex = []
    for x in range(0, questions):
        arr = myPixelVal[x]
        myIndexVal = np.where(arr==np.amax(arr))
        #print(myIndexVal[0])
        myIndex.append(myIndexVal[0][0])
    print(myIndex)

    imgQRGray = cv2.cvtColor(imgQRColored, cv2.COLOR_BGR2GRAY)
    cv2.imwrite("temp_image.png", imgQRGray)
    read_qr_code("temp_image.png")

    


imgBlank = np.zeros_like(img)
imageArray = ([img, imgGray, imgBlur, imgCanny],
              [imgContours, imgBiggestContours, imgWarpColored, imgThresh])

imgStacked = stackImages(imageArray, 0.5)

cv2.imshow("Original", imgStacked)
cv2.waitKey(0)