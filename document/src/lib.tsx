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
  type: string,
  options?: object,
  props?: object,
  content?: string | number,
  childIds?: Array<string>,
  _templatedParentId?: 'string';
};

export type Template = {
  nodes: Record<string, ElementProps>,
  root: Array<string>,
};

export type ComponentDefinition = {
  type: ComponentTypes,
  availableOptions?: Record<string, any>,
  template?: Template,
  render?: React.ElementType,
};

export type DocumentProps = {
  debug?: boolean,
  file: {
    version: Versions,
    nodes: Record<string, ElementProps>,
    root: Array<string>,
  },
  components?: Record<string, ComponentDefinition>,
  prefixIds?: string,
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
        if (currentObj[key] instanceof Array) {
          currentObj[key] = [ ...currentObj[key] ];
        } else {
          // spread operator ensures all new references here
          currentObj[key] = { ...currentObj[key] };
        }
        todo.push(currentObj[key]);
      } else if (typeof currentObj[key] === 'string') {
        currentObj[key] = fillTemplateString(currentObj[key], data);
      }
    });
  }

  return newRootObj;
};

const TanukiDocumentContext = React.createContext<DocumentProps>({ file: { version: Versions.v1, nodes: {}, root: [] } });
const useTanukiDocumentContext = () => React.useContext(TanukiDocumentContext);

const TanukiElement = (props: ElementProps) => {
  let {type, id, childIds, _templatedParentId, ...otherProps} = props;
  const rootProps = useTanukiDocumentContext();

  let Component: string | React.FunctionComponent<any> | React.ComponentClass<any, any> = type;

  const customComponent = rootProps?.components?.[type] ?? null;
  if (customComponent && customComponent.type === ComponentTypes.module) {
    const renderer = customComponent?.render ?? null;
    if (!renderer) {
      console.warn(`"renderer" missing for custom component "${type}", which is required for "module" components, using a React.Fragment instead.`);
    }
    Component = renderer ?? React.Fragment;
  }

  if (customComponent && customComponent.type === ComponentTypes.template) {
    const template = customComponent?.template ?? null;
    if (!template) {
      console.warn(`"template" missing for custom component "${type}", which is required for "template" components, using a React.Fragment instead.`);
      Component = React.Fragment;
    } else {
      return (
        <Document
          debug={rootProps.debug}
          file={{
            version: rootProps.file.version,
            nodes: deepProcessStrings(template.nodes, { options: otherProps.options }) as Record<string, ElementProps>,
            root: template.root,
          }}
          components={rootProps.components}
          prefixIds={rootProps.prefixIds ? `${rootProps.prefixIds}-${id}`: id }
        />
      );
    }
  }

  let nodeProps = {
    ...(rootProps?.debug ? {
      'data-tanuki-id': (rootProps.prefixIds ? `${rootProps.prefixIds}-${id}` : id),
    } : {}),
    ...otherProps.props,
    ...(
      type === ComponentTypes.module ? {
        options: otherProps.options,
      } : {}
    )
  };

  return (
    <Component {...nodeProps}>
      { (props.childIds ?? [])
        .map<ElementProps | null>((id: string) => rootProps.file.nodes?.[id] ?? null)
        .map((child) : React.ReactNode => {
          if (!child) { return; }
          return <TanukiElement key={child.id} {...child} />
      }) as React.ReactNode[] }
      { typeof props.content === 'string' ? fillTemplateString(props.content, { options: otherProps.options }) : null }
      { typeof props.content === 'number' ? props.content : null }
    </Component>
  );
}

export const Document = (props: DocumentProps) => {
  return (
    <TanukiDocumentContext.Provider value={props}>
      { props.file.root.map((childId) => {
          const childNode = props.file.nodes[childId];
          return (<TanukiElement key={childNode.id} {...childNode} />);
        })
      }
    </TanukiDocumentContext.Provider>
  );
};
