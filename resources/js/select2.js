// Reaproveita jQuery carregada - evita 2 jQuery
const $ = window.jQuery || window.$;

if (!$) {
   console.error(
      "jQuery não encontrado em window. Verifique `resources/assets/vendor/libs/jquery/jquery.js` antes de `resources/js/select2.js`."
   );
}

// Carrega Select2 e registra o idioma pt-BR
const select2Loader = (async () => {
   if (!$) return;

   // Select2 =>  $.fn.select2
   const select2Module = await import("select2/dist/js/select2.full");
   const select2Factory = select2Module?.default ?? select2Module;

   if (typeof select2Factory === "function") {
      select2Factory(window, $);
   }

   // Alguns bundlers podem anexar automaticamente; validamos para dar erro claro
   if (typeof $.fn?.select2 !== "function") {
      throw new TypeError(
         "Select2 não foi inicializado em $.fn.select2 (factory não executada/compatibilidade de bundle)."
      );
   }

   // i18n do Select2 depende do id `jQuery`
   const i18nRaw = (await import("select2/dist/js/i18n/pt-BR.js?raw")).default;
   // eslint-disable-next-line no-new-func
   new Function("jQuery", i18nRaw)($);
})().catch((error) => {
   console.error("Falha ao carregar Select2:", error);
});

const defaultSingleOptions = {
   theme: "bootstrap-5",
   language: "pt-BR",
   width: "100%",
   placeholder: "Selecione uma opção",
   allowClear: true,
};

const defaultMultipleOptions = {
   theme: "bootstrap-5",
   language: "pt-BR",
   width: "100%",
   placeholder: "Selecione as opções",
   allowClear: true,
};

function hydrateSelect($element, options) {
   if (!$element.length) return;

   if ($element.hasClass("select2-hidden-accessible")) {
      $element.select2("destroy");
   }

   $element
      .select2(options)
      .off("change.select2.livewire")
      .on("change.select2.livewire", function (e) {
         // Evita loop infinito: ao disparar um `change` aqui dentro,
         // o mesmo handler seria chamado novamente
         const originalEvent = e?.originalEvent ?? e;
         if (originalEvent?.__select2LivewireSynthetic) return;

         const inputEvent = new Event("input", { bubbles: true });
         inputEvent.__select2LivewireSynthetic = true;
         this.dispatchEvent(inputEvent);

         const changeEvent = new Event("change", { bubbles: true });
         changeEvent.__select2LivewireSynthetic = true;
         this.dispatchEvent(changeEvent);
      });
}

export function initializeSelect2(scope = document) {
   const $scope = $(scope);
   hydrateSelect($scope.find(".select2-init"), defaultSingleOptions);
   hydrateSelect($scope.find(".select2-multiple"), defaultMultipleOptions);
}

function boot() {
   select2Loader.then(() => initializeSelect2());
}

// Inicializa quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", boot);

// Reidrata após atualizações do Livewire (V3)
document.addEventListener("livewire:init", () => {
   select2Loader.then(() => boot());

   Livewire.hook("morph.updated", ({ el }) => {
      select2Loader.then(() => initializeSelect2(el));
   });
});

// global (devolve promessa para garantir carregamento prévio)
window.initializeSelect2 = (...args) =>
   select2Loader.then(() => initializeSelect2(...args));
