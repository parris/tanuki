import { DataType } from 'pg-mem';

export default (db) => {
  db.public.registerFunction({
    name: 'jsonb_set',
    args: [DataType.jsonb, DataType.text, DataType.jsonb, DataType.bool],
    returns: DataType.jsonb,
    implementation: (original, path, newData, inject) => {
      const pathParts = path.replace(/\{|\}|\"/g, '').split(',');
      const result = JSON.parse(JSON.stringify(original));
      let current = result;

      while (pathParts.length) {
        const currentPart = pathParts.shift();
        if (!current[currentPart] && inject) {
          current[currentPart] = {};
        } else if (!current[currentPart] && !inject) {
          return original;
        }

        if (pathParts.length === 0) {
          current[currentPart] = newData;
        } else if (inject) {
          current = current[currentPart];
        }
      }

      return result;
    },
  });
  db.public.registerFunction({
    name: 'jsonb_insert',
    args: [DataType.jsonb, DataType.text, DataType.jsonb],
    returns: DataType.jsonb,
    implementation: (original, path, newData) => {
      const pathParts = path.replace(/\{|\}|\"/g, '').split(',');
      const result = JSON.parse(JSON.stringify(original));
      let current = result;

      while (pathParts.length) {
        const currentPart = pathParts.shift();
        if (pathParts.length === 0) {
          if (current instanceof Array && !isNaN(parseInt(currentPart, 10))) {
            const position = parseInt(currentPart, 10);
            current.splice(position, 0, newData);
          } else if (typeof current === 'object') {
            current[currentPart] = newData;
          }
        } else if (!current[currentPart]) {
          return original;
        }

        current = current[currentPart];
      }

      return result;
    },
  });
  db.public.registerFunction({
    name: 'to_jsonb',
    args: [DataType.text],
    returns: DataType.jsonb,
    implementation: (original) => {
      return original;
    },
  });
};
