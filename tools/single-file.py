#!/usr/bin/env python3
"""Gera a versão de arquivo único do LuminSDK.

Pega no index.html do site e "cola" dentro dele o CSS, os scripts e o ícone,
produzindo um único .html que funciona sozinho em qualquer lugar
(CodePen, Gist, uma pasta qualquer, até anexo de e-mail).

Uso:
    python3 tools/single-file.py              # gera single/index.html
    python3 tools/single-file.py --out /tmp/x.html
    python3 tools/single-file.py --root . --quiet

Sem dependências: só a biblioteca padrão.
"""

from __future__ import annotations

import argparse
import base64
import re
import sys
from pathlib import Path

BANNER = """<!--
  LuminSDK — versão de arquivo único (HTML + CSS + JS juntos).

  Gerado automaticamente por tools/single-file.py a partir do site oficial.
  Não edite este arquivo à mão: rode o gerador de novo depois de mexer no site.

  Código-fonte: https://github.com/SuckingUpToesSry/LuminSDK
  Licença: MIT · criado por Ryan Smith
-->"""

# arquivos que entram no HTML, na ordem em que aparecem no index.html
STYLES = ["assets/css/styles.css", "assets/css/app.css"]
SCRIPTS = [
    "assets/js/library.js",
    "assets/js/settings.js",
    "assets/js/progress.js",
    "assets/js/site.js",
    "assets/js/cloak.js",
    "assets/js/anim.js",
    "assets/js/astolfo.js",
    "assets/js/atmosphere.js",
    "assets/js/bonus.js",
    "assets/js/app.js",
]

# tags de <head> que não fazem sentido num arquivo solto (apontariam para 404)
DROP_TAGS = [
    r'[ \t]*<link rel="manifest"[^>]*>\r?\n',
    r'[ \t]*<link rel="apple-touch-icon"[^>]*>\r?\n',
]

# imagens referenciadas por url() no CSS entram como data URI no arquivo único
# (só a versão leve: o arquivo único é o catálogo de jogos e não pode pesar 1 MB)
INLINE_IMAGES = [
    ("../img/astolfo/astolfo-bg-1280.jpg", "assets/img/astolfo/astolfo-bg-1280.jpg"),
]

SW_GUARD_FROM = "    if (!('serviceWorker' in navigator)) return;"
SW_GUARD_TO = "    if (window.__LUMIN_SINGLE__ || !('serviceWorker' in navigator)) return;"


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def data_uris(css: str, root: Path) -> str:
    """Troca url(../img/...) por data URI: o arquivo único não tem pasta ao lado."""
    for rel, real in INLINE_IMAGES:
        path = root / real
        if not path.is_file():
            continue
        mime = "image/png" if path.suffix.lower() == ".png" else "image/jpeg"
        payload = base64.b64encode(path.read_bytes()).decode("ascii")
        css = css.replace(f'url("{rel}")', f'url("data:{mime};base64,{payload}")')
        css = css.replace(f"url({rel})", f"url(data:{mime};base64,{payload})")
    # a arte grande não entra: o fundo "-1280" é reutilizado no lugar dela
    css = css.replace('url("../img/astolfo/astolfo-bg.jpg")', 'url("../img/astolfo/astolfo-bg-1280.jpg")')
    return css


def inline_css(html: str, root: Path) -> tuple[str, list[str]]:
    inlined: list[str] = []

    def repl(match: re.Match[str]) -> str:
        href = match.group(1)
        path = root / href.split("?")[0]
        if not href.startswith("assets/") or not path.is_file():
            return match.group(0)
        css = read_text(path).strip("\n")
        css = data_uris(css, root)
        inlined.append(href)
        return f"  <!-- {href} -->\n  <style>\n{css}\n  </style>"

    # aceita atributos extras (id, media…): o <link> do tema Astolfo tem id
    html = re.sub(
        r'[ \t]*<link rel="stylesheet" href="([^"]+)"[^>]*>',
        repl,
        html,
    )
    return html, inlined


def inline_scripts(html: str, root: Path) -> tuple[str, list[str]]:
    inlined: list[str] = []
    blocks: list[str] = []

    for rel in SCRIPTS:
        path = root / rel
        if not path.is_file():
            raise SystemExit(f"erro: {rel} não encontrado")
        code = read_text(path).strip("\n")
        if "</script" in code.lower():
            raise SystemExit(f"erro: {rel} contém a string </script e não pode ser embutido")
        code = code.replace(SW_GUARD_FROM, SW_GUARD_TO)
        inlined.append(rel)
        blocks.append(f"/* ==================== {rel} ==================== */\n{code}")

    if not blocks:
        raise SystemExit("erro: nenhum script local para embutir")

    joined = "\n\n".join(blocks) + "\n"
    payload = (
        "  <!-- CSS e JS do site embutidos por tools/single-file.py -->\n"
        "  <script>\n"
        "  window.__LUMIN_SINGLE__ = true;\n"
        "  /* âncoras internas rolam sem gravar nada depois da barra na URL */\n"
        "  document.addEventListener('click', function (event) {\n"
        "    var link = event.target.closest && event.target.closest('a[href^=\"#\"]');\n"
        "    if (!link) return;\n"
        "    var id = (link.getAttribute('href') || '').slice(1);\n"
        "    event.preventDefault();\n"
        "    if (!id) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }\n"
        "    var target = document.getElementById(id);\n"
        "    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });\n"
        "  });\n"
        f"{joined}"
        "  </script>\n"
    )

    html, count = re.subn(
        r'[ \t]*<script src="assets/js/app\.js[^"]*"[^>]*></script>\r?\n',
        lambda _m: payload,
        html,
    )
    if count == 0:
        raise SystemExit("erro: tag do app.js não encontrada no index.html")
    return html, inlined


def inline_icon(html: str, root: Path) -> tuple[str, bool]:
    icon = root / "assets/img/favicon.svg"
    if not icon.is_file():
        return html, False
    data = base64.b64encode(icon.read_bytes()).decode("ascii")
    uri = f"data:image/svg+xml;base64,{data}"
    html = re.sub(
        r'<link rel="icon" href="[^"]*"',
        f'<link rel="icon" href="{uri}"',
        html,
    )
    html = re.sub(
        r'<link rel="mask-icon" href="[^"]*"',
        f'<link rel="mask-icon" href="{uri}"',
        html,
    )
    return html, True


def build(root: Path) -> tuple[str, dict[str, object]]:
    index = root / "index.html"
    if not index.is_file():
        raise SystemExit(f"erro: {index} não encontrado (rode dentro do repositório do site)")

    html = read_text(index)

    # o arquivo único é o catálogo Lumin: a tela de entrada, o LuminOS, os
    # componentes flutuantes, o rail de abas e as outras views saem daqui
    strip = [
        (r"[ \t]*<!-- =+ TELA DE ENTRADA =+ -->[\s\S]*?(?=[ \t]*<!-- =+ LuminOS)", "entrada"),
        (r"[ \t]*<!-- =+ LuminOS =+ -->[\s\S]*?(?=[ \t]*<!-- presença e atalhos)", "luminos"),
        (r"[ \t]*<!-- presença e atalhos[\s\S]*?(?=[ \t]*<nav class=\"tabrail\")", "flutuantes"),
        (r"[ \t]*<nav class=\"tabrail\"[\s\S]*?</nav>\r?\n", "rail"),
        (r"[ \t]*<!-- =+ VIEW: HUB =+ -->[\s\S]*?(?=[ \t]*<!-- =+ VIEW: LUMIN)", "hub"),
        (r"[ \t]*<!-- =+ VIEW: GN-MATH =+ -->[\s\S]*?(?=[ \t]*<!-- =+ VIEW: SITES)", "gn"),
        (r"[ \t]*<!-- =+ VIEW: SITES =+ -->[\s\S]*?(?=[ \t]*<!-- =+ VIEW: ESTUDOS)", "sites"),
        (r"[ \t]*<!-- =+ VIEW: ESTUDOS =+ -->[\s\S]*?(?=[ \t]*<!-- =+ VIEW: NAVEGADOR)", "estudo"),
        (r"[ \t]*<!-- =+ VIEW: NAVEGADOR =+ -->[\s\S]*?(?=[ \t]*<!-- =+ VIEW: PROVEDOR)", "navegador"),
        (r"[ \t]*<!-- =+ VIEW: PROVEDOR =+ -->[\s\S]*?(?=[ \t]*<!-- player e aviso)", "provedor"),
        (r"[ \t]*<script src=\"assets/js/social\.js[^\"]*\"[^>]*></script>\r?\n", "social.js"),
        (r"[ \t]*<link rel=\"stylesheet\" href=\"assets/css/social\.css[^\"]*\"[^>]*>\r?\n", "social.css"),
        (r"[ \t]*<link rel=\"stylesheet\" href=\"assets/css/os\.css[^\"]*\"[^>]*>\r?\n", "os.css"),
        (r"[ \t]*<link rel=\"stylesheet\" href=\"assets/css/lcore\.css[^\"]*\"[^>]*>\r?\n", "lcore.css"),
        (r"[ \t]*<script src=\"assets/js/lcore\.js[^\"]*\"[^>]*></script>\r?\n", "lcore.js"),
        (r"[ \t]*<!-- abertura em about:blank[\s\S]*?-->\r?\n[ \t]*<script src=\"assets/js/cloak\.js[^\"]*\"[^>]*></script>\r?\n", "cloak.js"),
        (r"[ \t]*<!-- anima[^\n]*assets/js/anim\.js -->\n[ \t]*<link rel=\"stylesheet\" href=\"assets/css/anim\.css[^\"]*\"[^>]*>\r?\n", "anim.css"),
        (r"[ \t]*<script src=\"assets/js/anim\.js[^\"]*\"[^>]*></script>\r?\n", "anim.js"),
    ]
    for pattern, label in strip:
        html, count = re.subn(pattern, "", html, count=1)
        if count != 1:
            raise SystemExit(f"erro: não consegui remover {label} do index.html")

    html, css_files = inline_css(html, root)
    html, js_files = inline_scripts(html, root)

    # o arquivo único é o site de jogos: não deve redirecionar para os estudos
    html = re.sub(
        r"[ \t]*<!-- LANDING-ESTUDOS[\s\S]*?</script>\r?\n",
        "",
        html,
        count=1,
    )

    # o arquivo único é só o catálogo de jogos: as outras abas saem
    html = re.sub(
        r"[ \t]*<!-- =+ VIEW: GN-MATH[\s\S]*?(?=[ \t]*<!-- =+ VIEW: SITES)",
        "", html, count=1,
    )
    html = re.sub(
        r"[ \t]*<!-- =+ VIEW: SITES[\s\S]*?(?=[ \t]*<!-- =+ VIEW: ESTUDOS)",
        "", html, count=1,
    )
    html = re.sub(
        r"[ \t]*<!-- =+ VIEW: ESTUDOS[\s\S]*?(?=[ \t]*<!-- player e aviso)",
        "", html, count=1,
    )
    html = re.sub(r"[ \t]*<nav class=\"tabrail\"[\s\S]*?</nav>\r?\n", "", html, count=1)
    html = html.replace('<div class="app-view" id="view-lumin" data-view="lumin" hidden>',
                        '<div class="app-view is-active" id="view-lumin" data-view="lumin">')

    for pattern in DROP_TAGS:
        html = re.sub(pattern, "", html)

    html, icon_ok = inline_icon(html, root)

    # arquivo solto não tem as outras abas: manda para a versão publicada
    html = re.sub(r'<a [^>]*data-route="gn"[^>]*>', '<a href="https://suckinguptoessry.github.io/LuminSDK/" target="_blank" rel="noopener">', html)
    html = re.sub(r'<a [^>]*data-route="sites"[^>]*>', '<a href="https://suckinguptoessry.github.io/LuminSDK/" target="_blank" rel="noopener">', html)
    html = re.sub(r'<a [^>]*data-route="estudo"[^>]*>', '<a href="https://suckinguptoessry.github.io/LuminSDK/study/" target="_blank" rel="noopener">', html)
    html = re.sub(r'<a [^>]*data-route="lumin"[^>]*>', '<a href="https://suckinguptoessry.github.io/LuminSDK/" target="_blank" rel="noopener">', html)

    html = re.sub(r'<a [^>]*data-route="(browser|admin|provider)"[^>]*>', '<a href="https://suckinguptoessry.github.io/LuminSDK/" target="_blank" rel="noopener">', html)

    # ícones da barra lateral continuam em arquivo: aponta para a versão publicada
    html = re.sub(
        r'src="assets/img/([^"]+)"',
        r'src="https://suckinguptoessry.github.io/LuminSDK/assets/img/\1"',
        html,
    )

    html = html.replace("<!DOCTYPE html>", "<!DOCTYPE html>\n" + BANNER, 1)
    html = html.replace(
        '<meta name="author" content="Ryan Smith">',
        '<meta name="author" content="Ryan Smith">\n'
        '  <meta name="generator" content="tools/single-file.py">',
        1,
    )

    info = {"css": css_files, "js": js_files, "icon": icon_ok}
    return html, info


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Gera a versão de arquivo único do LuminSDK.")
    parser.add_argument("--root", default=".", help="raiz do site (padrão: pasta atual)")
    parser.add_argument("--out", default="single/index.html", help="arquivo de saída")
    parser.add_argument("--quiet", action="store_true", help="não imprime o resumo")
    args = parser.parse_args(argv)

    root = Path(args.root).resolve()
    html, info = build(root)

    out = Path(args.out)
    if not out.is_absolute():
        out = root / out
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")

    if not args.quiet:
        size = out.stat().st_size
        print(f"arquivo único gerado: {out}")
        print(f"  tamanho: {size / 1024:.0f} KB · {html.count(chr(10)) + 1} linhas")
        print(f"  CSS embutido: {', '.join(info['css']) or 'nenhum'}")
        print(f"  JS embutido: {', '.join(info['js'])}")
        print(f"  ícone embutido: {'sim' if info['icon'] else 'não'}")
        print("  externo: apenas o script do LuminSDK (CDN) e as fontes do Google")
    return 0


if __name__ == "__main__":
    sys.exit(main())
