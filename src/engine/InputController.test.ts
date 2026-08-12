import assert from 'node:assert/strict';
import test from 'node:test';
import { InputController, type PointerCaptureMode } from './InputController.ts';

class FakeInputElement {
  addEventListener(): void {}
  removeEventListener(): void {}
  getBoundingClientRect(): { left: number; top: number } {
    return { left: 0, top: 0 };
  }
}

type PointerHandler = (event: PointerEvent) => void;
type InputCamera = ConstructorParameters<typeof InputController>[1];

function fakeCamera(onPan?: () => void): InputCamera & { x: number; y: number; zoom: number } {
  const camera = {
    x: 0,
    y: 0,
    zoom: 1,
    panByScreen(dx: number, dy: number) {
      onPan?.();
      camera.x -= dx / camera.zoom;
      camera.y -= dy / camera.zoom;
    },
  };
  return camera as unknown as InputCamera & { x: number; y: number; zoom: number };
}

function pointerEvent(opts: {
  pointerId?: number;
  pointerType?: string;
  button?: number;
  clientX: number;
  clientY: number;
}): PointerEvent {
  return {
    pointerId: opts.pointerId ?? 1,
    pointerType: opts.pointerType ?? 'mouse',
    button: opts.button ?? 0,
    clientX: opts.clientX,
    clientY: opts.clientY,
    target: null,
    preventDefault() {},
  } as unknown as PointerEvent;
}

function handlers(controller: InputController): {
  down: PointerHandler;
  move: PointerHandler;
  up: PointerHandler;
} {
  const privateController = controller as unknown as {
    onPointerDown: PointerHandler;
    onPointerMove: PointerHandler;
    onPointerUp: PointerHandler;
  };
  return {
    down: privateController.onPointerDown,
    move: privateController.onPointerMove,
    up: privateController.onPointerUp,
  };
}

test('reports blank-surface viewport intent before the pan threshold and camera movement', () => {
  const events: string[] = [];
  const camera = fakeCamera(() => events.push('camera-pan'));

  const controller = new InputController(
    new FakeInputElement() as unknown as HTMLElement,
    camera,
    {
      onPointerDown: () => {
        events.push('world-pointer-down');
        return null;
      },
      onViewportInteractionChange: (active) => events.push(`viewport:${active}`),
      onViewportMotionChange: (active) => events.push(`motion:${active}`),
      onInteractingChange: (active) => events.push(`interacting:${active}`),
      onChange: () => events.push('camera-change'),
    },
    { enablePointerCapture: false },
  );
  const input = handlers(controller);

  input.down(pointerEvent({ clientX: 10, clientY: 10 }));
  assert.deepEqual(events, ['world-pointer-down', 'viewport:true']);

  input.move(pointerEvent({ clientX: 12, clientY: 10 }));
  assert.deepEqual(events, ['world-pointer-down', 'viewport:true']);
  assert.equal(camera.x, 0);

  input.move(pointerEvent({ clientX: 15, clientY: 10 }));
  assert.deepEqual(events, [
    'world-pointer-down',
    'viewport:true',
    'interacting:true',
    'motion:true',
    'camera-pan',
    'camera-change',
  ]);
  assert.equal(camera.x, -5);

  input.up(pointerEvent({ clientX: 15, clientY: 10 }));
  assert.deepEqual(events.slice(-3), ['motion:false', 'viewport:false', 'interacting:false']);
});

test('a blank click keeps tap semantics while a captured node interaction is not viewport intent', () => {
  const clickEvents: string[] = [];
  const clickController = new InputController(
    new FakeInputElement() as unknown as HTMLElement,
    fakeCamera(),
    {
      onPointerDown: () => null,
      onViewportInteractionChange: (active) => clickEvents.push(`viewport:${active}`),
      onViewportMotionChange: (active) => clickEvents.push(`motion:${active}`),
      onInteractingChange: (active) => clickEvents.push(`interacting:${active}`),
      onTap: () => clickEvents.push('tap'),
    },
    { enablePointerCapture: false },
  );
  const clickInput = handlers(clickController);
  clickInput.down(pointerEvent({ clientX: 4, clientY: 6 }));
  clickInput.up(pointerEvent({ clientX: 4, clientY: 6 }));
  assert.deepEqual(clickEvents, ['viewport:true', 'viewport:false', 'tap']);

  const capturedEvents: string[] = [];
  const capturedController = new InputController(
    new FakeInputElement() as unknown as HTMLElement,
    fakeCamera(),
    {
      onPointerDown: (): PointerCaptureMode => 'node',
      onViewportInteractionChange: (active) => capturedEvents.push(`viewport:${active}`),
      onInteractingChange: (active) => capturedEvents.push(`interacting:${active}`),
    },
    { enablePointerCapture: false },
  );
  const capturedInput = handlers(capturedController);
  capturedInput.down(pointerEvent({ clientX: 3, clientY: 8 }));
  assert.deepEqual(capturedEvents, ['interacting:true']);
  capturedInput.up(pointerEvent({ clientX: 3, clientY: 8 }));
  assert.deepEqual(capturedEvents, ['interacting:true', 'interacting:false']);
});
