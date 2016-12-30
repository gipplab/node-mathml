'use strict';

function callAPI(evt) {
  evt.preventDefault();
  let formData = new FormData();
  const accept = document.querySelector('.option-svg').checked ? 'image/svg+xml': 'application/json';
  formData.append('reference_mathml', document.querySelector('#referenceMML').value);
  formData.append('comparison_mathml', document.querySelector('#comparisonMML').value);
  formData.append('comparison_mml', document.querySelector('#comparisonMML').value);
  formData.append('similarities', document.querySelector('#similarities').value);
  fetch('/api/v1/math/renderMergedAST', {
    method: 'POST',
    headers: new Headers({
      'Accept': accept,
    }),
    body: formData
  }).then(function(data){
    data.headers.get('content-type');
    return data.text().then((text) => {
      return {
        headers: data.headers,
        text
      }
    });
  }).then(function(result){
    document.querySelector('.renderedAST').innerHTML = result.text;
    if (result.headers.get('content-type') === 'image/svg+xml; charset=utf-8') {
      eval(decodeHTML(document.querySelector('.renderedAST script').innerHTML));
    }
  }).catch(console.log);
}

function decodeHTML(html){
  var txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}
