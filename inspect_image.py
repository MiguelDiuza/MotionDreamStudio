from PIL import Image
import numpy as np
import os
folder=r'C:\Users\mandi\Downloads\motion_dreamStudio\assets\images\flyers'
for name in ['bannerEventos.jpg','bannerFlyer2.jpg','bannerFlyerAnim.jpg','bannerSocialMedia.jpg','bannersocialMarca.jpg']:
    path=os.path.join(folder,name)
    if os.path.exists(path):
        im=Image.open(path)
        arr=np.array(im)
        print(name, arr.shape, 'top avg', arr[:10].mean(axis=(0,1)))
    else:
        print(name,'not found')
