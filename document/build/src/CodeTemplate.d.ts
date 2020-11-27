declare abstract class TypeDef {
    abstract simplifiedTypeName: string;
    isRequired: boolean;
    required(): TypeDef;
    abstract validFor(value: any): boolean;
}
declare class StringType extends TypeDef {
    simplifiedTypeName: string;
    validFor(value: string): boolean;
    toString(): string;
}
declare class NumberType extends TypeDef {
    simplifiedTypeName: string;
    validFor(value: string): boolean;
    toString(): string;
}
declare class BooleanType extends TypeDef {
    simplifiedTypeName: string;
    validFor(value: string): boolean;
    toString(): string;
}
declare class ArrayType extends TypeDef {
    simplifiedTypeName: string;
    private validTypes;
    of(type: TypeDef | Array<TypeDef>): ArrayType;
    validFor(values: Array<TypeDef>): boolean;
    toString(): string;
}
interface Shape {
    [key: string]: TypeDef;
}
declare class ObjectType extends TypeDef {
    simplifiedTypeName: string;
    shape: Shape;
    private exact;
    constructor(exact?: boolean);
    of(type: Shape): ObjectType;
    validFor(values: InputValues): boolean;
    toString(): string;
}
export declare const Types: {
    string: () => StringType;
    number: () => NumberType;
    bool: () => BooleanType;
    array: () => ArrayType;
    shape: () => ObjectType;
    exactShape: () => ObjectType;
};
export declare type PropertyName = string;
export declare type InputSet = Record<PropertyName, TypeDef>;
export declare type InputValues = Record<PropertyName, any>;
export declare type ValidationError = {
    propertyName: 'string';
    problem: 'string';
    errorCode: number;
};
export declare class ValidationErrorSet extends Error {
    validationErrors: Array<ValidationError>;
    constructor(validationErrors: Array<ValidationError>);
    toString(): string;
}
export declare function validatePropertyValues(propertySet: InputSet, propertyValues: InputValues): void;
export declare class CodeTemplate {
    properties: InputSet;
    template: (properties: InputValues) => any;
    outputType: TypeDef;
    constructor(properties: InputSet, template: (properties: InputValues) => any, outputType: TypeDef);
    run(propertyValues: InputValues | object): any;
}
export declare function createInputDefinition(properties: object): InputSet;
export declare function createCodeTemplate(inputProperties: InputSet | object, template: (properties: InputValues) => any, type: TypeDef): CodeTemplate;
export {};
//# sourceMappingURL=CodeTemplate.d.ts.map