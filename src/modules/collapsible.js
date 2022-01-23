/**
 * Defines the [Collapsible]{@link module:collapsible~Collapsible} class.
 * @module collapsible
 */

/**
 * Object holding private members for the
 * [Collapsible]{@link module:collapsible~Collapsible} class.
 * @typedef {Object} module:collapsible~Collapsible~privates
 * @property {HTMLElement} container The collapsible element.
 * @property {HTMLElement} content The inner container holding the collapsible
 *   contents.
 * @property {boolean} collapsed Indicates whether the container is currently
 *   collapsed or not.
 */

/**
 * Holds private date for the
 * [Collapsible]{@link module:collapsible~Collapsible} class.
 * @type {WeakMap}
 * @see module:collapsible~Collapsible~privates
 */
const privateMembers = new WeakMap();

/**
 * A container on the page that can be expanded or collapsed.
 */
class Collapsible {
  /**
   * Create a collapsible panel and add it to the DOM.
   * @param {HTMLElement} parent The parent node under which the collapsible is
   *   to be inserted.
   * @param {HTMLElement} [referenceNode=null] The child node before which the
   *   collapsible should be inserted. If not given, the collapsible will be
   *   appended at the end of the parent's child nodes.
   * @param {Object} [options={}] Specifies additional options for the modal.
   * @param {string} [options.id] The identifier for the collapsible container.
   * @param {string[]} [options.classList] An array of class names to be
   *   applied to the collapsible container.
   * @param {boolean} [options.collapsed] Specifies whether the panel should be
   *   initially collapsed.
   */
  constructor(parent, referenceNode = null, options = {}) {
    const container = document.createElement('div');
    if (options.id) container.id = options.id;
    container.classList.add('collapsible');
    if (options.classList) container.classList.add(...options.classList);

    const innerContainer = document.createElement('div');
    innerContainer.classList.add('collapsible-content');
    container.appendChild(innerContainer);
    parent.insertBefore(container, referenceNode);

    const privates = {
      container,
      content: innerContainer,
      collapsed: false,
    };
    privateMembers.set(this, privates);

    if ('collapsed' in options && options.collapsed) this.collapse();
    else this.expand();
  }

  /**
   * Determines whether the container is currently collapsed.
   * @type {boolean}
   */
  get collapsed() {
    return privateMembers.get(this).collapsed;
  }

  set collapsed(collapsed) {
    if (collapsed) this.collapse();
    else this.expand();
  }

  /**
   * The inner container element holding the panel's content.
   * @type {HTMLElement}
   */
  get content() {
    return privateMembers.get(this).content;
  }

  /**
   * Expand the panel, so that its contents are visible.
   */
  expand() {
    const privates = privateMembers.get(this);
    privates.collapsed = false;
    privates.container.classList.remove('collapsed');
    privates.container.removeAttribute('aria-hidden');
    this.update();
  }

  /**
   * Collapse the panel, so that its contents are hidden.
   */
  collapse() {
    const privates = privateMembers.get(this);
    privates.collapsed = true;
    privates.container.classList.add('collapsed');
    privates.container.setAttribute('aria-hidden', 'true');
    this.update();
  }

  /**
   * Toggle the collapsed state of the panel.
   * @returns {boolean} True if the panel is in the collapsed state after the
   *   toggle, and false otherwise.
   */
  toggle() {
    const privates = privateMembers.get(this);
    if (privates.collapsed) this.expand();
    else this.collapse();
    return privates.collapsed;
  }

  /**
   * Update the collapsible container to account for changes to its content.
   * This will recalculate the height of the container and should be called
   * whenever the panel's content is altered.
   */
  update() {
    const privates = privateMembers.get(this);
    const height = privates.collapsed
      ? '0' : `${privates.content.offsetHeight}px`;
    privates.container.style.height = height;
  }
}

export default Collapsible;
