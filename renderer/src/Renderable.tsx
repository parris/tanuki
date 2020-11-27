import * as React from "react";
import * as templateStrings from 'es6-template-string';

export enum TanukiVersions {
  v1 = 'v1.0'
};

export enum TanukiComponentType {
  module = 'module',
  template = 'templates',
};

export type TanukiElementProps = {
  id: string,
  type: React.ElementType | TanukiComponentType,
  componentType?: string,
  options?: object,
  props?: object | null,
  nodes?: Array<TanukiElementProps | String | number> | null,
  _templatedParentId?: 'string';
};

export type TanukiComponent = {
  availableOptions?: Record<string, any>,
  template?: TanukiElementProps,
  render?: React.ElementType,
};

export type DocumentProps = {
  version: TanukiVersions,
  debug?: boolean,
  styles?: Record<string, React.CSSProperties>,
  templates?: Record<string, TanukiElementProps>,
  components?: Record<string, TanukiComponent>,
  body: Array<TanukiElementProps>,
};

const fillTemplateString = (templateString: string, inputVars: { options?: object }) => {
  return templateStrings(templateString, inputVars);
}

const deepProcessStrings = (obj: Record<string, any>, data: { options?: object }): object => {
  const newRootObj: Record<string, any> = {...obj};
  let processed: Record<string, any> = [];
  let todo: Record<string, any> = [newRootObj];

  while (todo.length) {
    const currentObj = todo.pop();
    if (typeof currentObj === 'undefined' || processed.includes(currentObj)) { break; }
    processed.push(currentObj);

    const currentKeys = Object.keys(currentObj);
    currentKeys.forEach((key) => {
      if (typeof currentObj[key] === 'object') {
        // spread operator ensures all new references here
        currentObj[key] = { ...currentObj[key] };
        todo.push(currentObj[key]);
      } else if (typeof currentObj[key] === 'string') {
        currentObj[key] = fillTemplateString(currentObj[key], data);
      }
    });
  }

  return newRootObj;
};

const TanukiDocumentContext = React.createContext<DocumentProps>({ version: TanukiVersions.v1, body: [] });
const useTanukiDocumentContext = () => React.useContext(TanukiDocumentContext);

const TanukiElement = (props: TanukiElementProps) => {
  let {type, id, componentType, nodes, _templatedParentId, ...otherProps} = props;
  const rootProps = useTanukiDocumentContext();

  // strange typescript issue here with optional chaining before brackets
  const customComponent = ((rootProps?.components) ?? {})[(componentType ?? '')];
  let Component;
  let templateProps = {};

  if (type === TanukiComponentType.module) {
    const renderer = customComponent?.render ?? null;
    if (!renderer) {
      console.warn(`Non-existant component type referenced ${componentType} for node ${id}, using a Fragment instead.`);
    }
    Component = renderer ?? React.Fragment;
  } else if (type === TanukiComponentType.template) {
    const template = customComponent?.template ?? null;
    if (!template) {
      console.warn(`Non-existant component type referenced ${componentType} for node ${id}, using a Fragment instead.`);
      Component = React.Fragment;
    } else {
      // Template component types must be standard React.ElementTypes. Tanuki Component types are not allowed at the root.
      Component = template.type as React.ElementType;
      templateProps = { ...template.props } as TanukiElementProps;
      nodes = template.nodes;
    }
  } else {
    Component = type;
  }

  let nodeProps = deepProcessStrings({
    ...(rootProps?.debug ? { 'data-tanuki-id': id } : {}),
    ...templateProps,
    ...otherProps.props,
    ...(
      type === TanukiComponentType.module ? {
        options: otherProps.options,
      } : {}
    )
  }, { options: otherProps.options });

  return (
    <Component {...nodeProps}>
      { nodes?.map((child) : React.ReactNode => {
        const isImmediatelyRenderable = typeof child === 'number' || typeof child === 'string';
        if (isImmediatelyRenderable) {
          if (typeof child === 'string') {
            return fillTemplateString(child, { options: otherProps.options });
          }
          return child;
        } else if (['string', 'function'].includes(typeof (child as TanukiElementProps).type)) {
          const childProps = (child as TanukiElementProps);

          const _parentId = type === TanukiComponentType.template ? props.id : _templatedParentId;
          const hasTemplateParentId = Boolean(_parentId);
          const id = `${hasTemplateParentId ? `${_parentId}-` : '' }${childProps.id}`;
          const optionalChildProps = {
            options: {
              ...(props.options || {}),
              ...(childProps.options || {}),
            },
            _templateParentId: _parentId,
          };

          return <TanukiElement key={id} {...childProps} id={id} {...optionalChildProps} />;
        }

        return null;
      }) as React.ReactNode[] }
    </Component>
  );
}

const Document = (props: DocumentProps) => {
  return (
    <TanukiDocumentContext.Provider value={props}>
      { props.body.map((child) => <TanukiElement key={(child as TanukiElementProps).id} {...child} />) }
    </TanukiDocumentContext.Provider>
  );
};

export default Document;
