function someMethod() {
  setTimeout(() => {
    const lastVisitedScreens = this.getLastOpenedScreen();
    if (lastVisitedScreens) {
      let lastLoadedButton;
      let sectionIdx = 0;
      let foundSectionIdx = 0;
      for (const section of this.viewData) {
        for (const button of section.buttons) {
          if (button.label === lastVisitedScreens) {
            lastLoadedButton = button;
            foundSectionIdx = sectionIdx;
            break;
          }
        }
        if (lastLoadedButton) break;
        sectionIdx++;
      }
      if (lastLoadedButton) {
        this.selectedSectionIndex = foundSectionIdx;
        this.present(lastLoadedButton.view());
      }
    }
  }, 500);
}