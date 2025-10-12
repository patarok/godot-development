interface DropAnimationSideEffectsParameters {
    active: {
        id: string | number;
        data: any;
        node: HTMLElement;
        rect: DOMRect;
    };
    dragOverlay: {
        node: HTMLElement;
        rect: DOMRect;
    };
}

type DropAnimationSideEffects = (
    parameters: DropAnimationSideEffectsParameters
) => (() => void) | void;

type Styles = Partial<Record<keyof CSSStyleDeclaration, string>>;

interface DefaultDropAnimationSideEffectsOptions {
    className?: {
        active?: string;
        dragOverlay?: string;
    };
    styles?: {
        active?: Styles;
        dragOverlay?: Styles;
    };
}

export const defaultDropAnimationSideEffects =
    (options: DefaultDropAnimationSideEffectsOptions): DropAnimationSideEffects =>
        ({ active, dragOverlay }) => {
            const originalStyles: Record<string, string> = {};
            const { styles, className } = options;

            if (styles?.active) {
                for (const [key, value] of Object.entries(styles.active)) {
                    if (value === undefined) continue;

                    originalStyles[key] = active.node.style.getPropertyValue(key);
                    active.node.style.setProperty(key, value);
                }
            }

            if (styles?.dragOverlay) {
                for (const [key, value] of Object.entries(styles.dragOverlay)) {
                    if (value === undefined) continue;
                    dragOverlay.node.style.setProperty(key, value);
                }
            }

            if (className?.active) {
                active.node.classList.add(className.active);
            }

            if (className?.dragOverlay) {
                dragOverlay.node.classList.add(className.dragOverlay);
            }

            return function cleanup() {
                for (const [key, value] of Object.entries(originalStyles)) {
                    active.node.style.setProperty(key, value);
                }

                if (className?.active) {
                    active.node.classList.remove(className.active);
                }
            };
        };