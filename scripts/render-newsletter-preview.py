"""Amostra visual local com dados fictícios. Não consulta banco nem APIs."""
import sys
from datetime import date
from pathlib import Path

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / "services/intelligence"))
from newsletter_images import render_cards

articles = [{"title": "Indústria cearense ganha novo impulso", "summary": "Amostra fictícia para testar somente o layout.",
             "card_headline": "Confecção cearense investe na formação de novos profissionais",
             "card_context": "Neste exemplo fictício, empresas e instituições ampliam a formação técnica voltada à produção de vestuário.",
             "url": "https://example.com/noticia", "published_at": "2026-10-21"},
            {"title": "Inovação transforma o setor têxtil", "summary": "Amostra fictícia para testar somente o layout.",
             "card_headline": "Novos materiais entram no radar da indústria têxtil",
             "card_context": "Exemplo fictício de chamada com contexto: pesquisa e produção se aproximam para testar aplicações em tecidos.",
             "url": "https://example.com/inovacao", "published_at": "2026-10-20"}]
output = root.parent / "outputs"
output.mkdir(exist_ok=True)
cards = render_cards(articles, "Amostra visual fictícia.", date(2026, 10, 15), date(2026, 10, 22), {"image_mode": "free"})
for card in cards:
    (output / f"radar-card-preview-{card['position']+1}.png").write_bytes(card["content"])
print(f"{len(cards)} cards de QA, 1080×1350, sem chamadas externas.")
