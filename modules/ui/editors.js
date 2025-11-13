"use strict";
function editStates() {
  if (customization) return;
  const Editor = (
    "../dynamic/editors/states-editor.js?v=1.108.1"
  );
  Editor.open();
}

function editCultures() {
  if (customization) return;
  const Editor = (
    "../dynamic/editors/cultures-editor.js?v=1.105.23"
  );
  Editor.open();
}

function editReligions() {
  if (customization) return;
  const Editor = (
    "../dynamic/editors/religions-editor.js?v=1.104.0"
  );
  Editor.open();
}
