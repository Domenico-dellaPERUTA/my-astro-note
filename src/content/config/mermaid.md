---
theme: "neutral"
themeVariables:
  fontFamily: "Inter, sans-serif"
  primaryColor: "#ffffff"
  primaryTextColor: "#000000"
  primaryBorderColor: "#000000"
  lineColor: "#333333"
  secondaryColor: "#f4f4f4"
  tertiaryColor: "#ffffff"
  mainBkg: "#ffffff"
  nodeBorder: "#000000"
  clusterBkg: "#ffffff"
  clusterBorder: "#333333"
  defaultLinkColor: "#333333"
  titleColor: "#333333"
  edgeLabelBackground: "#ffffff"
  actorBorder: "#000000"
  actorBkg: "#ffffff"
flowchart:
  curve: "linear"
themeCSS: |
  /* HACK: Forza la dimensione del contenitore del testo a essere minima */
  .node.rhombus foreignObject {
      width: 10px !important;
      height: 10px !important;
      overflow: visible !important;
  }
  
  /* Sposta il testo (che ora esce dal box) a destra */
  .node.rhombus .label {
      color: black !important;
      transform: translate(30px, -10px);
      white-space: nowrap;
  }

  /* Reimposta la scala del poligono a quasi normale, dato che ora il contenuto è piccolo */
  .node.rhombus polygon {
      transform: scale(0.8);
      transform-origin: center;
      fill: #ffffff !important;
      stroke: #000000 !important;
  }
---

# Configurazione Mermaid
Questo file controlla lo stile grafico di tutti i diagrammi.
Il tema "neutral" con colori bianco/nero assicura uno stile professionale e pulito (UML-like).
