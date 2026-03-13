from PIL import Image, ImageDraw, ImageFont

img = Image.new('RGB', (400, 300), color = (255, 255, 255))
d = ImageDraw.Draw(img)
d.text((10,10), "UPI Transaction Successful\nAmount ₹2000\nUTR 3459A8BC921D\nBank HDFC", fill=(0,0,0))
img.save('test_receipt_valid.jpg')
