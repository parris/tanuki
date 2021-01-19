import { useState } from 'react';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import update from 'immutability-helper';

import './App.css';

const style = {
  marginBottom: '.5rem',
  backgroundColor: 'white',
  cursor: 'move',
}

type CardDef = {
  id: string,
  text: string,
  parent: string | null,
  childIds: Array<string>,
  direction?: string,
};

type DocumentDef = {
  components: Record<string, CardDef>,
  bodyId: string,
  rootNodeIds: Array<string>,
};

const ITEMS: DocumentDef = {
  components: {
    '0': {
      id: '0',
      parent: null,
      text: '',
      childIds: ['1', '2', '3'],
    },
    '1': {
      id: '1',
      parent: '0',
      text: 'Write a cool JS library',
      childIds: ['4'],
    },
    '2': {
      id: '2',
      parent: '0',
      text: 'Make it generic enough',
      childIds: ['5'],
      direction: 'row',
    },
    '3': {
      id: '3',
      parent: '0',
      text: 'Write README',
      childIds: ['6'],
    },
    '4': {
      id: '4',
      parent: '1',
      text: 'Create some examples',
      childIds: ['7', '8'],
    },
    '5': {
      id: '5',
      parent: '2',
      text: 'Spam in Twitter and IRC to promote it',
      childIds: [],
    },
    '6': {
      id: '6',
      parent: '3',
      text: '???',
      childIds: [],
    },
    '7': {
      id: '7',
      parent: '4',
      text: 'PROFIT',
      childIds: [],
    },
    '8': {
      id: '8',
      parent: '4',
      text: 'PROFIT AGAIN',
      childIds: [],
    },
  },
  bodyId: '0',
  rootNodeIds: ['0'],
};


export interface CardProps {
  cards: DocumentDef
  id: string,
  card: CardDef, // null means it's the root
  childIds: Array<string>
  moveCard: (id: string, parentId: string, to: number) => void
  findCard: (id: string) => { index: number }
}

interface Item {
  type: string
  id: string
  parent: string | null,
  originalIndex: string
}

const Card: React.FC<CardProps> = ({ cards, id, card, childIds, moveCard, findCard }) => {
  const originalIndex = id ? findCard(id).index : null;
  const [{ isDragging }, drag] = useDrag({
    canDrag: () => card.parent !== null, // can't drag the "body" card
    item: { type: 'CARD', id, originalIndex },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [, drop] = useDrop({
    accept: 'CARD',
    canDrop: () => true,
    drop(item: Item, monitor) {
      const isOver = monitor.isOver({ shallow: true });
      const {id: movingComponentId} = monitor.getItem();
      if (isOver && movingComponentId !== id) {
        moveCard(
          movingComponentId,
          cards.components[id].parent ?? cards.bodyId,
          findCard(id).index
        );
      }
    },
  });

  const [, dropChild] = useDrop({
    accept: 'CARD',
    canDrop: () => true,
    drop(item: Item, monitor) {
      const isOver = monitor.isOver({ shallow: true });
      const {id: movingComponentId} = monitor.getItem();
      if (isOver && movingComponentId !== id) {
        moveCard(
          movingComponentId,
          id,
          findCard(id).index
        );
      }
    },
  });

  const opacity = isDragging ? 0 : 1

  return (
    <div ref={(node) => drag(drop(node))} style={{ ...style, opacity }}>
      {card?.text}
      <div ref={dropChild} style={{ padding: 10, border: '1px dashed gray'}} className={`${card.parent === null ? 'BodyTree' : '' } ${card.direction === 'row' ? 'Row' : ''}`}>
        {(childIds || []).map((cardId) => (
          <Card
            cards={cards}
            key={cardId}
            id={cardId}
            card={cards.components[cardId]}
            childIds={cards.components[cardId]?.childIds}
            moveCard={moveCard}
            findCard={findCard}
          />
        ))}
      </div>
    </div>
  )
}

const Container: React.FC = () => {
  const [cards, setCards] = useState(ITEMS);
  const moveCard = (id: string, newParentId: string, atIndex: number) => {
    const movingCard = findCard(id);
    const oldParentId: string = movingCard.card.parent ?? cards.bodyId;
    let newCards = cards;

    // remove the card from the old parent and add it to the new one
    newCards = update(newCards, {
      components: {
        [movingCard.card.id]: { parent: { $set: newParentId } },
        [oldParentId]: { childIds: {
          $set: newCards.components[oldParentId].childIds.filter((childId) => childId !== movingCard.card.id) }
        },
      },
    });
    // just in case old parent is the new parent, lets separate out this update so we can rely on result above
    const parentChildIds = newCards.components[newParentId].childIds;
    newCards = update(newCards, {
      components: {
        [newParentId]: { childIds: {
          $set: [...parentChildIds.slice(0, atIndex), movingCard.card.id, ...parentChildIds.slice(atIndex)] }
        },
      },
    });

    setCards(newCards);
  }

  const findCard = (id: string) => {
    const card = cards.components[id];
    let parentChildren: Array<string> = [];
    let isRoot = false;
    if (!card.parent) {
      parentChildren = cards.rootNodeIds;
      isRoot = true;
    } else {
      parentChildren = cards.components[card.parent]?.childIds ?? [];
      isRoot = false;
    }
    return {
      card,
      isRoot,
      index: parentChildren.indexOf(card.id),
    };
  }

  return (
    <Card
      id={cards.bodyId}
      cards={cards}
      card={cards.components[cards.bodyId]}
      childIds={cards.components[cards.bodyId].childIds}
      moveCard={moveCard}
      findCard={findCard}
    />
  );
}
export default function MyReactApp() {
  return (
    <DndProvider backend={HTML5Backend}>
      <Container />
    </DndProvider>
  )
}
