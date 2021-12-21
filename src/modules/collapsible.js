/**
 * Defines the [Collapsible]{@link module:collapsible~Collapsible} class.
 * @module collapsible
 */

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
   * @param {boolean} [collapsed=false] Specifies whether the panel should be
   *   initially collapsed.
   */
  constructor(parent, referenceNode = null, collapsed = false) {
    const container = document.createElement('div');
    container.classList.add('collapsible');

    const innerContainer = document.createElement('div');
    innerContainer.classList.add('collapsible-content');
    container.appendChild(innerContainer);
    parent.insertBefore(container, referenceNode);

    /**
     * The collapsible element.
     * @type {HTMLElement}
     */
    this._container = container;

    /**
     * The inner container holding the collapsible contents.
     * @type {HTMLElement}
     */
    this._content = innerContainer;

    /**
     * Indicates whether the container is currently collapsed or not.
     * @type {boolean}
     */
    this._collapsed = false;

    this.collapsed = collapsed;
  }

  /**
   * Determines whether the container is currently collapsed.
   * @type {boolean}
   */
  get collapsed() {
    return this._collapsed;
  }

  set collapsed(collapsed) {
    if (collapsed)
      this.collapse();
    else
      this.expand();
  }

  /**
   * The inner container element holding the panel's content.
   * @type {HTMLElement}
   */
  get content() {
    return this._content;
  }

  /**
   * Expand the panel, so that its contents are visible.
   */
  expand() {
    this._collapsed = false;
    this._container.classList.remove('collapsed');
    this._container.removeAttribute('aria-hidden');
    this.update();
  }

  /**
   * Collapse the panel, so that its contents are hidden.
   */
  collapse() {
    this._collapsed = true;
    this._container.classList.add('collapsed');
    this._container.setAttribute('aria-hidden', 'true');
    this.update();
  }

  /**
   * Toggle the collapsed state of the panel.
   * @returns {boolean} True if the panel is in the collapsed state after the
   *   toggle, and false otherwise.
   */
  toggle() {
    if (this._collapsed)
      this.expand();
    else
      this.collapse();
    return this._collapsed;
  }

  /**
   * Update the collapsible container to account for changes to its content.
   * This will recalculate the height of the container and should be called
   * whenever the panel's content is altered.
   */
  update() {
    if (this._collapsed) {
      this._container.style.height = '0';
    } else if (document.readyState !== 'loading') {
      this._container.style.height = `${this._content.offsetHeight}px`;
    } else {
      document.addEventListener('DOMContentLoaded',
        () => this.update(), { once: true });
    }
  }
}

export default Collapsible;
