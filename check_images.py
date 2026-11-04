from PIL import Image
import os
folder=r'c:\Users\mandi\Downloads\motion_dreamStudio\assets\images\flyers'
names=['bannerFlyer2.jpg','bannerFlyerAnim.jpg','bannersocialMarca.jpg','bannerSocialMedia.jpg']
for name in names:
    path=os.path.join(folder,name)
    if os.path.exists(path):
        im=Image.open(path)
        print(name, im.size)
    else:
        print(name,'not found')
