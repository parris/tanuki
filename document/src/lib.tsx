import * as React from "react";
import * as templateStrings from 'es6-template-string';

export enum Versions {
  v1 = 'v1.0'
};

export enum ComponentTypes {
  module = 'module',
  template = 'templates',
};

export type ElementProps = {
  id: string,
  type: React.ElementType | ComponentTypes,
  componentType?: string,
  options?: object,
  props?: object | null,
  nodes?: Array<ElementProps | String | number> | null,
  _templatedParentId?: 'string';
};

export type ComponentDefinition = {
  availableOptions?: Record<string, any>,
  template?: ElementProps,
  render?: React.ElementType,
};

export type DocumentProps = {
  debug?: boolean,
  file: {
    version: Versions,
    body: Array<ElementProps>,
  },
  components?: Record<string, ComponentDefinition>,
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

const TanukiDocumentContext = React.createContext<DocumentProps>({ file: { version: Versions.v1, body: [] } });
const useTanukiDocumentContext = () => React.useContext(TanukiDocumentContext);

const TanukiElement = (props: ElementProps) => {
  let {type, id, componentType, nodes, _templatedParentId, ...otherProps} = props;
  const rootProps = useTanukiDocumentContext();

  // strange typescript issue here with optional chaining before brackets
  const customComponent = ((rootProps?.components) ?? {})[(componentType ?? '')];
  let Component;
  let templateProps = {};

  if (type === ComponentTypes.module) {
    const renderer = customComponent?.render ?? null;
    if (!renderer) {
      console.warn(`Non-existant component type referenced ${componentType} for node ${id}, using a Fragment instead.`);
    }
    Component = renderer ?? React.Fragment;
  } else if (type === ComponentTypes.template) {
    const template = customComponent?.template ?? null;
    if (!template) {
      console.warn(`Non-existant component type referenced ${componentType} for node ${id}, using a Fragment instead.`);
      Component = React.Fragment;
    } else {
      // Template component types must be standard React.ElementTypes. Tanuki Component types are not allowed at the root.
      Component = template.type as React.ElementType;
      templateProps = { ...template.props } as ElementProps;
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
      type === ComponentTypes.module ? {
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
        } else if (['string', 'function'].includes(typeof (child as ElementProps).type)) {
          const childProps = (child as ElementProps);

          const _parentId = type === ComponentTypes.template ? props.id : _templatedParentId;
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

export const Document = (props: DocumentProps) => {
  return (
    <TanukiDocumentContext.Provider value={props}>
      { props.file.body.map((child) => <TanukiElement key={(child as ElementProps).id} {...child} />) }
    </TanukiDocumentContext.Provider>
  );
};
