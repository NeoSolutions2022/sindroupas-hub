"""Cards PNG determinísticos: os fatos e links são os mesmos da edição textual."""
import io
import os
from pathlib import Path
from urllib.parse import urlparse

from PIL import Image, ImageDraw, ImageFont


def font(size, bold=False):
    configured = os.environ.get("NEWSLETTER_FONT_BOLD" if bold else "NEWSLETTER_FONT", "")
    candidates = [configured,
                  f"/usr/share/fonts/truetype/dejavu/DejaVuSans{'-Bold' if bold else ''}.ttf",
                  f"C:/Windows/Fonts/arial{'bd' if bold else ''}.ttf"]
    for path in candidates:
        if path and Path(path).is_file():
            return ImageFont.truetype(path, size)
    raise ValueError("Fonte para os cards não instalada. Instale fonts-dejavu-core no serviço.")


def lines(text, selected_font, width):
    wrapped = []
    for paragraph in text.splitlines() or [""]:
        current = ""
        for character in paragraph:
            if current and selected_font.getlength(current + character) > width:
                split = current.rfind(" ")
                if split > len(current)//2:
                    wrapped.append(current[:split])
                    current = current[split+1:] + character
                else:
                    wrapped.append(current)
                    current = character
            else:
                current += character
        wrapped.append(current)
    return wrapped


def render_cards(articles, reading, start, end, config):
    cards = []
    title_font, body_font, small_font = font(50, True), font(32), font(23)
    blocks = [{"title": a["title"], "body": a["summary"], "source": f"Fonte: {urlparse(a['url']).hostname} • {a['published_at']}", "url": a["url"]} for a in articles]
    blocks.append({"title": "Leitura da semana", "body": reading, "source": "Curadoria SindRoupas • Moda, indústria e consumo", "url": config.get("cta_url", "")})
    for index, block in enumerate(blocks):
        if len(block["title"]) > 350 or len(block["body"]) > 1800 or len(block["url"]) > 2000:
            raise ValueError("Texto extenso demais para um card legível. Revise a edição.")
        title_lines = lines(block["title"], title_font, 888)
        body_lines = lines(block["body"], body_font, 888)
        link_lines = lines(block["url"], small_font, 888) if block["url"] else []
        height = max(1080, 560 + len(title_lines)*64 + len(body_lines)*46 + len(link_lines)*32)
        image = Image.new("RGB", (1080, height), "#f7f7f1")
        draw = ImageDraw.Draw(image)
        draw.rectangle((0, 0, 1080, 170), fill="#263b2d")
        draw.text((72, 36), "RADAR MODA", font=font(52, True), fill="#ffffff")
        draw.text((74, 108), f"CEARÁ + INDÚSTRIA & CONSUMO  |  {start:%d/%m} → {end:%d/%m}", font=small_font, fill="#dce5ce")
        y = 230
        for text in title_lines:
            draw.text((72, y), text, font=title_font, fill="#24352a")
            y += 64
        y += 28
        for text in body_lines:
            draw.text((72, y), text, font=body_font, fill="#34483a")
            y += 46
        y += 30
        draw.line((72, y, 1008, y), fill="#b9c5ad", width=2)
        y += 20
        for text in lines(block["source"], small_font, 888):
            draw.text((72, y), text, font=small_font, fill="#506548")
            y += 32
        for text in link_lines:
            draw.text((72, y), text, font=small_font, fill="#506548")
            y += 32
        footer = f"SindRoupas   •   {index+1}/{len(blocks)}"
        draw.text((72, height-68), footer, font=small_font, fill="#506548")
        if index == len(blocks)-1 and config.get("cta_url"):
            label = config.get("cta_label") or "Entre em contato"
            for number, line in enumerate(lines(label, small_font, 660)):
                draw.text((540, height-146 + number*30), line, anchor="mt", font=small_font, fill="#263b2d")
        output = io.BytesIO()
        image.save(output, format="PNG", optimize=True)
        cards.append({"content": output.getvalue(), "caption": f"Radar Moda • {block['title']}", "position": index})
    return cards
