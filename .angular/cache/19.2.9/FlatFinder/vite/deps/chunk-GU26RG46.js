import {
  _ViewRepeaterOperation
} from "./chunk-TNRDA67F.js";
import {
  Injectable,
  setClassMetadata,
  ɵɵdefineInjectable
} from "./chunk-BV452GVP.js";

// node_modules/@angular/cdk/fesm2022/unique-selection-dispatcher-Cnrf4muk.mjs
var UniqueSelectionDispatcher = class _UniqueSelectionDispatcher {
  _listeners = [];
  /**
   * Notify other items that selection for the given name has been set.
   * @param id ID of the item.
   * @param name Name of the item.
   */
  notify(id, name) {
    for (let listener of this._listeners) {
      listener(id, name);
    }
  }
  /**
   * Listen for future changes to item selection.
   * @return Function used to deregister listener
   */
  listen(listener) {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter((registered) => {
        return listener !== registered;
      });
    };
  }
  ngOnDestroy() {
    this._listeners = [];
  }
  static ɵfac = function UniqueSelectionDispatcher_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _UniqueSelectionDispatcher)();
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _UniqueSelectionDispatcher,
    factory: _UniqueSelectionDispatcher.ɵfac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(UniqueSelectionDispatcher, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], null, null);
})();

// node_modules/@angular/cdk/fesm2022/dispose-view-repeater-strategy-BLw1RSwm.mjs
var _DisposeViewRepeaterStrategy = class {
  applyChanges(changes, viewContainerRef, itemContextFactory, itemValueResolver, itemViewChanged) {
    changes.forEachOperation((record, adjustedPreviousIndex, currentIndex) => {
      let view;
      let operation;
      if (record.previousIndex == null) {
        const insertContext = itemContextFactory(record, adjustedPreviousIndex, currentIndex);
        view = viewContainerRef.createEmbeddedView(insertContext.templateRef, insertContext.context, insertContext.index);
        operation = _ViewRepeaterOperation.INSERTED;
      } else if (currentIndex == null) {
        viewContainerRef.remove(adjustedPreviousIndex);
        operation = _ViewRepeaterOperation.REMOVED;
      } else {
        view = viewContainerRef.get(adjustedPreviousIndex);
        viewContainerRef.move(view, currentIndex);
        operation = _ViewRepeaterOperation.MOVED;
      }
      if (itemViewChanged) {
        itemViewChanged({
          context: view?.context,
          operation,
          record
        });
      }
    });
  }
  detach() {
  }
};

export {
  UniqueSelectionDispatcher,
  _DisposeViewRepeaterStrategy
};
//# sourceMappingURL=chunk-GU26RG46.js.map
