(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.circuit = {}));
}(this, (function (exports) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    function __spreadArrays() {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    }

    var TypeDef = /** @class */ (function () {
        function TypeDef() {
            this.isRequired = false;
        }
        TypeDef.prototype.required = function () {
            this.isRequired = true;
            return this;
        };
        return TypeDef;
    }());
    var StringType = /** @class */ (function (_super) {
        __extends(StringType, _super);
        function StringType() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.simplifiedTypeName = 'string';
            return _this;
        }
        StringType.prototype.validFor = function (value) {
            if (this.isRequired && (value === null || value === undefined)) {
                return false;
            }
            if (typeof value === 'string') {
                return true;
            }
            return false;
        };
        StringType.prototype.toString = function () { return this.simplifiedTypeName; };
        return StringType;
    }(TypeDef));
    var NumberType = /** @class */ (function (_super) {
        __extends(NumberType, _super);
        function NumberType() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.simplifiedTypeName = 'number';
            return _this;
        }
        NumberType.prototype.validFor = function (value) {
            if (this.isRequired && (value === null || value === undefined)) {
                return false;
            }
            if (typeof value === 'number') {
                return true;
            }
            return false;
        };
        NumberType.prototype.toString = function () { return this.simplifiedTypeName; };
        return NumberType;
    }(TypeDef));
    var BooleanType = /** @class */ (function (_super) {
        __extends(BooleanType, _super);
        function BooleanType() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.simplifiedTypeName = 'boolean';
            return _this;
        }
        BooleanType.prototype.validFor = function (value) {
            if (this.isRequired && (value === null || value === undefined)) {
                return false;
            }
            if (typeof value === 'boolean') {
                return true;
            }
            return false;
        };
        BooleanType.prototype.toString = function () { return this.simplifiedTypeName; };
        return BooleanType;
    }(TypeDef));
    var ArrayType = /** @class */ (function (_super) {
        __extends(ArrayType, _super);
        function ArrayType() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.simplifiedTypeName = 'array';
            _this.validTypes = null;
            return _this;
        }
        ArrayType.prototype.of = function (type) {
            this.validTypes = type;
            return this;
        };
        ArrayType.prototype.validFor = function (values) {
            var _this = this;
            if (!this.isRequired && (values === null || values === undefined)) {
                return true;
            }
            if (!this.validTypes && values instanceof Array) {
                return true;
            }
            return values.reduce(function (valid, value) {
                if (!valid) {
                    return valid;
                }
                if (_this.validTypes instanceof Array) {
                    return _this.validTypes.reduce(function (oneOfThemIsValid, currentType) {
                        if (oneOfThemIsValid) {
                            return oneOfThemIsValid;
                        }
                        return currentType.validFor(value);
                    }, false);
                }
                return _this.validTypes.validFor(value);
            }, true);
        };
        ArrayType.prototype.toString = function () {
            if (!this.validTypes) {
                return '[]';
            }
            var types = (this.validTypes instanceof Array) ? (this.validTypes.map(function (type) {
                return type.toString();
            }, '').join(', ')) : this.validTypes.toString();
            return "[ " + types + " ]";
        };
        return ArrayType;
    }(TypeDef));
    function allKeysExist(shape, obj) {
        if (!shape) {
            return true;
        }
        return Object.keys(shape).reduce(function (memo, key) {
            if (!memo) {
                return memo;
            }
            if (shape[key].isRequired && !obj[key]) {
                return false;
            }
            if (shape[key] instanceof ObjectType) {
                return allKeysExist(shape[key].shape, obj[key]);
            }
            if (obj[key]) {
                return true;
            }
            return false;
        }, true);
    }
    var ObjectType = /** @class */ (function (_super) {
        __extends(ObjectType, _super);
        function ObjectType(exact) {
            if (exact === void 0) { exact = false; }
            var _this = _super.call(this) || this;
            _this.simplifiedTypeName = 'object';
            _this.shape = {};
            _this.exact = false;
            _this.exact = exact;
            return _this;
        }
        ObjectType.prototype.of = function (type) {
            this.shape = type;
            return this;
        };
        ObjectType.prototype.validFor = function (values) {
            var _this = this;
            if (!this.isRequired && (values === null || values === undefined)) {
                return true;
            }
            if (!this.shape && values instanceof Object) {
                return true;
            }
            // all values match their types
            return (Object.keys(values).reduce(function (valid, key) {
                if (!valid) {
                    return valid;
                }
                if (_this.exact && !_this.shape[key]) {
                    return false;
                }
                if (_this.shape[key]) {
                    _this.shape[key].validFor(values[key]);
                }
                return valid;
            }, true) && (
            // all keys in shape exist
            allKeysExist(this.shape, values)));
        };
        ObjectType.prototype.toString = function () {
            var _this = this;
            var keys = Object.keys(this.shape).map(function (key) {
                return "string: " + _this.shape[key].toString();
            }).join(' ');
            return "{ " + (this.shape ? keys : '') + " }";
        };
        return ObjectType;
    }(TypeDef));
    var Types = {
        string: function () { return new StringType(); },
        number: function () { return new NumberType(); },
        bool: function () { return new BooleanType(); },
        array: function () { return new ArrayType(); },
        shape: function () { return new ObjectType(false); },
        exactShape: function () { return new ObjectType(true); },
    };
    function validationErrorsToMessage(validationErrors) {
        return "ValidationErrors:\n" + validationErrors.map(function (error) { return error.problem; }).join('\n  ');
    }
    var ValidationErrorSet = /** @class */ (function (_super) {
        __extends(ValidationErrorSet, _super);
        function ValidationErrorSet(validationErrors) {
            var _newTarget = this.constructor;
            var _this = _super.call(this, validationErrorsToMessage(validationErrors)) || this;
            Object.setPrototypeOf(_this, _newTarget.prototype);
            _this.validationErrors = validationErrors;
            return _this;
        }
        ValidationErrorSet.prototype.toString = function () {
            return validationErrorsToMessage(this.validationErrors);
        };
        return ValidationErrorSet;
    }(Error));
    function validatePropertyValues(propertySet, propertyValues) {
        var propertySetKeys = Object.keys(propertySet);
        var propertyValuesKeys = Object.keys(propertyValues);
        var errors = [];
        propertyValuesKeys.forEach(function (key) {
            if (!propertySet[key]) {
                errors.push({
                    errorCode: 1,
                    propertyName: key,
                    problem: "Extra property given '" + key + "': the circuit was asked to run with a value not included in its properties"
                });
                return; // all other tests expect that propertySet[key] exists
            }
            if (propertySet[key].isRequired && (propertyValues[key] === null || propertyValues[key] === undefined)) {
                errors.push({
                    errorCode: 2,
                    propertyName: key,
                    problem: "Unexpected null property for '" + key + "': the circuit was run with a null value for non-nullable property"
                });
            }
            if (!propertySet[key].validFor(propertyValues[key])) {
                var stringifiedValue = '';
                try {
                    stringifiedValue = JSON.stringify(propertyValues);
                }
                catch (_) {
                    stringifiedValue = propertySet[key] instanceof ObjectType ? 'circular object' : 'circular array';
                }
                errors.push({
                    errorCode: 3,
                    propertyName: key,
                    problem: propertySet[key] instanceof ObjectType || propertySet[key] instanceof ArrayType ?
                        "Mismatched type for '" + key + "': the circuit was run with an invalid shape expected " + propertySet[key].toString() + " for " + stringifiedValue :
                        "Mismatched type for '" + key + "': the circuit was run with a mismatched type got '" + typeof propertyValues[key] + "' expected '" + propertySet[key].simplifiedTypeName + "'"
                });
            }
        });
        propertySetKeys.forEach(function (key) {
            if (propertySet[key].isRequired && (propertyValues[key] === null || propertyValues[key] === undefined)) {
                errors.push({
                    errorCode: 2,
                    propertyName: key,
                    problem: "Unexpected null property for '" + key + "': the circuit was run with a null value for non-nullable property"
                });
            }
        });
        if (errors.length > 0) {
            throw new ValidationErrorSet(errors);
        }
    }
    var CodeTemplate = /** @class */ (function () {
        function CodeTemplate(properties, template, outputType) {
            this.properties = properties;
            this.template = template;
            this.outputType = outputType;
        }
        CodeTemplate.prototype.run = function (propertyValues) {
            validatePropertyValues(this.properties, propertyValues);
            return this.template(propertyValues);
        };
        return CodeTemplate;
    }());
    function createInputDefinition(properties) {
        return properties;
    }
    function createCodeTemplate(inputProperties, template, type) {
        return new CodeTemplate(inputProperties, template, type);
    }

    function runPartial(stepIndex, workflow, codeTemplates, runOperationIndexes) {
        if (runOperationIndexes === void 0) { runOperationIndexes = []; }
        if (runOperationIndexes.includes(stepIndex)) {
            throw new Error("Workflow is invalid, it contains a circular definition for step \"" + stepIndex + "\", steps run so far: " + runOperationIndexes);
        }
        var operation = workflow.steps[stepIndex];
        var codeTemplateName = operation.template;
        var template = codeTemplates[codeTemplateName];
        var nextRunOperationIndexes = runOperationIndexes.concat(stepIndex);
        var values = Object.assign.apply(Object, __spreadArrays([{},
            operation.input || {}], operation.connections ? Object.keys(operation.connections).map(function (inputName) {
            var _a;
            var stepIndex = operation.connections ? operation.connections[inputName] : null;
            if (stepIndex === null) {
                throw new Error("Workflow is invalid, step " + stepIndex + " has an invalid connection for \"" + inputName + "\"");
            }
            return _a = {},
                _a[inputName] = runPartial(stepIndex, workflow, codeTemplates, nextRunOperationIndexes),
                _a;
        }) : []));
        return template.run(values);
    }
    function run(workflow, templates) {
        return runPartial(workflow.resultStep, workflow, templates);
    }

    exports.CodeTemplate = CodeTemplate;
    exports.Types = Types;
    exports.ValidationErrorSet = ValidationErrorSet;
    exports.createCodeTemplate = createCodeTemplate;
    exports.createInputDefinition = createInputDefinition;
    exports.run = run;
    exports.validatePropertyValues = validatePropertyValues;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=lib.js.map
