import * as React from "react";

export type RenderableNode = {
  id: string,
  type: React.ElementType | 'component',
  componentType?: string,
  props: Object | null,
  children: Array<RenderableNode | String | number> | null,
  _rootProps?: RenderableRootProps
}

export type RenderableRootProps = {
  content: {
    version: String,
    children: Array<RenderableNode>,
    components: Record<string, React.ElementType>,
  },
};

const RenderNode = (props: RenderableNode) => {
  const {type, id, componentType, children, _rootProps, ...otherProps} = props;
  const isCustom = (type === 'component');
  const customComponent = props._rootProps?.content.components[componentType ?? ''];
  // we need to explicitly spell out type === 'component' otherwise we get a ts error down below
  const ComponentType = (type === 'component') ? (customComponent ?? React.Fragment) : type;

  if (isCustom && !customComponent) {
    console.warn(`Non-existant component type referenced ${componentType} for node ${id}, using a Fragment instead.`);
  }

  const nodeProps = {
    ...otherProps.props,
    ...(
      isCustom ? { _rootProps } : {}
    )
  }

  return (
    <ComponentType {...nodeProps}>
      { children?.map((child) : React.ReactNode => {
        const isImmediatelyRenderable = typeof child === 'number' || typeof child === 'string';
        if (isImmediatelyRenderable) {
          return child;
        } else if (['string', 'function'].includes(typeof (child as RenderableNode).type)) {
          return <RenderNode key={(child as RenderableNode).id} {...(child as RenderableNode)} />;
        }

        return null;
      }) }
    </ComponentType>
  );
}

const Renderable = (props: RenderableRootProps) => {
  return (
    <>
      { props.content.children.map((child) => <RenderNode key={(child as RenderableNode).id} {...child} _rootProps={props} />) }
    </>
  );
};

export default Renderable;
