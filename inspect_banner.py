from PIL import Image
import numpy as np
import os
path=r'C:\Users\mandi\Downloads\motion_dreamStudio\assets\images\flyers\bannerProyectos.jpg'
im=Image.open(path)
arr=np.array(im)
print('shape',arr.shape)
print('top row mean',arr[0].mean(axis=0))
print('first 10 rows average colors',arr[:10].mean(axis=(0,1)))
