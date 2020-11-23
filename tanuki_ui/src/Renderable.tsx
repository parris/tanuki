import * as React from "react";

export type RenderableNode = {
  id: string,
  type: React.ElementType,
  props: Object | null,
  children: Array<RenderableNode | String | number> | null,
}

export type RenderableRootProps = {
  content: {
    version: String,
    children: Array<RenderableNode>,
  },
};

const RenderNode = (props: RenderableNode) => {
  const {type, children, ...otherProps} = props;
  const ComponentType = type;

  return (
    <ComponentType {...otherProps}>
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
      { props.content.children.map((child) => <RenderNode key={(child as RenderableNode).id} {...child} />) }
    </>
  );
};

export default Renderable;
