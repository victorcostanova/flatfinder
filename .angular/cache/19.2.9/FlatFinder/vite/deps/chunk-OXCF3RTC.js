// node_modules/@angular/cdk/fesm2022/boolean-property-_aCfQwp8.mjs
function coerceBooleanProperty(value) {
  return value != null && `${value}` !== "false";
}

// node_modules/@angular/cdk/fesm2022/css-pixel-value-C1yoKJ7R.mjs
function coerceCssPixelValue(value) {
  if (value == null) {
    return "";
  }
  return typeof value === "string" ? value : `${value}px`;
}

// node_modules/@angular/cdk/fesm2022/coercion.mjs
function coerceStringArray(value, separator = /\s+/) {
  const result = [];
  if (value != null) {
    const sourceValues = Array.isArray(value) ? value : `${value}`.split(separator);
    for (const sourceValue of sourceValues) {
      const trimmedString = `${sourceValue}`.trim();
      if (trimmedString) {
        result.push(trimmedString);
      }
    }
  }
  return result;
}

export {
  coerceCssPixelValue,
  coerceBooleanProperty,
  coerceStringArray
};
//# sourceMappingURL=chunk-OXCF3RTC.js.map
