// SAM3 math prettifier — gjør LaTeX-aktige formler lesbare med ekte sub/sup-tags.
// Brukes av flashcards, formelquiz, multiple-choice, mock-eksamen og formelark.
(function(){
const TAB=String.fromCharCode(9);
// «Identifikator»: bokstaver/greske bokstaver, gjerne med påfølgende tall.
// Eksempler: t, e, priv, off, yt, t1. Stjerne og enkelt-spesialtegn håndteres separat.
const IDENT='[A-Za-zÀ-ɏͰ-ϿḀ-ỿ][A-Za-z0-9À-ɏͰ-ϿḀ-ỿ]*';
const SPECIAL='[*\'+−-]'; // tegn som kan stå alene i sub/sup (k^*, r^*, π^+)
const subBrace=/_\{([^{}]+)\}/g;
const supBrace=/\^\{([^{}]+)\}/g;
const supParen=/\^\(([^()]+)\)/g;
const subIdent=new RegExp('_('+IDENT+'|'+SPECIAL+'|[0-9]+)','g');
const supIdent=new RegExp('\\^('+IDENT+'|'+SPECIAL+'|[0-9]+)','g');

function escapeHtml(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

function prettifyMath(raw){
  if(!raw)return raw||'';
  let s=raw;
  // LaTeX-rester (JSON-decode har gjort \t til tab i noen tilfeller)
  s=s.split(TAB+'imes').join(' × ');
  s=s.replace(/\\times/g,' × ');
  s=s.replace(/\\cdot/g,' · ');
  s=s.replace(/\\quad/g,' ');
  s=s.replace(/\\,/g,' ');
  s=s.replace(/\\;/g,' ');
  s=s.replace(/\\ell/g,'ℓ');
  s=s.replace(/\\log\b/g,'log');
  s=s.replace(/\\ln\b/g,'ln');
  s=s.replace(/\\sum\b/g,'Σ');
  s=s.replace(/\\Delta\b/g,'Δ');
  s=s.replace(/\\alpha\b/g,'α');
  s=s.replace(/\\beta\b/g,'β');
  s=s.replace(/\\gamma\b/g,'γ');
  s=s.replace(/\\delta\b/g,'δ');
  s=s.replace(/\\epsilon\b/g,'ε');
  s=s.replace(/\\pi\b/g,'π');
  s=s.replace(/\\theta\b/g,'θ');
  s=s.replace(/\\kappa\b/g,'κ');
  s=s.replace(/\\lambda\b/g,'λ');
  s=s.replace(/\\rho\b/g,'ρ');
  s=s.replace(/\\sigma\b/g,'σ');
  s=s.replace(/\\mu\b/g,'μ');
  s=s.replace(/\\nu\b/g,'ν');
  s=s.replace(/\\omega\b/g,'ω');
  s=s.replace(/\\phi\b/g,'φ');
  s=s.replace(/\\psi\b/g,'ψ');
  // Multi-tegns klammer (sub/sup): {t+1}, {1-α}
  s=s.replace(subBrace,'<sub>$1</sub>');
  s=s.replace(supBrace,'<sup>$1</sup>');
  // ^(...) for formelquiz-svar som "L^(1−α)"
  s=s.replace(supParen,'<sup>$1</sup>');
  // Identifikator-versjon: _priv, _yt, ^α, _t, ^*
  s=s.replace(subIdent,'<sub>$1</sub>');
  s=s.replace(supIdent,'<sup>$1</sup>');
  return s;
}

// Prettifier kun innholdet i typiske matematikk-containere.
function prettifyInElement(rootEl){
  if(!rootEl)return;
  const sel='.formula, .inline-formula, .answer, .symbolFormula, .symbolAnswerGrid span';
  rootEl.querySelectorAll(sel).forEach(function(el){
    if(el.dataset.mathDone)return;
    if(el.children.length===0&&el.textContent){
      el.innerHTML=prettifyMath(escapeHtml(el.textContent));
      el.dataset.mathDone='1';
    }
  });
  // <b>-tagger i flashcard-svar inneholder ofte variabler som A_t, L_{yt} osv.
  rootEl.querySelectorAll('b, strong').forEach(function(el){
    if(el.dataset.mathDone)return;
    if(el.children.length===0&&el.textContent&&/[_^\\]/.test(el.textContent)){
      el.innerHTML=prettifyMath(escapeHtml(el.textContent));
      el.dataset.mathDone='1';
    }
  });
}

window.SAM3Math={prettifyMath:prettifyMath,prettifyInElement:prettifyInElement,escapeHtml:escapeHtml};
})();
