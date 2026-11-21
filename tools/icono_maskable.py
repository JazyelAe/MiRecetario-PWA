"""Crea el icono "maskable" a partir del icono de 512 px.
Android recorta los iconos maskable con distintas formas (círculo, gota, cuadrado redondeado); solo el
círculo central del 80 % es seguro. Por eso el dibujo se reduce y se rellena el resto con el color de fondo.
Uso: python tools/icono_maskable.py"""
from PIL import Image

original = Image.open("icons/icon-512.png").convert("RGB")
fondo = original.getpixel((4, 4))                 # el mismo tono oscuro del icono
lienzo = Image.new("RGB", (512, 512), fondo)
dibujo = original.resize((380, 380), Image.LANCZOS)  # 380/512 ≈ 74 %: queda dentro de la zona segura
lienzo.paste(dibujo, ((512 - 380) // 2, (512 - 380) // 2))
lienzo.save("icons/icon-maskable-512.png")
print("icons/icon-maskable-512.png creado; fondo", fondo)
