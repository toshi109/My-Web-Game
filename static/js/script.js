document.addEventListener("DOMContentLoaded", function () {
    const verseBox = document.getElementById("verseDisplay");
    const changeBtn = document.getElementById("change-verse");
    let verses = [];
  
    fetch('/api/random-verse')
      .then(response => response.json())
      .then(data => {
        // 初回の verse 表示を更新（必要なら）
        verseBox.textContent = data.verse;
      });
  
    if (changeBtn && verseBox) {
      changeBtn.addEventListener("click", async () => {
        const response = await fetch('/api/random-verse?t=' + new Date().getTime());
        const data = await response.json();
        verseBox.textContent = data.verse;
        document.getElementById('messageCard').textContent = data.verse;
      });
    }
  });
  
  document.addEventListener("DOMContentLoaded", function () {
    const changeBtn = document.getElementById("change-verse");

    if (changeBtn) {
        changeBtn.addEventListener("click", () => {
            console.log("ボタンがクリックされました！");
        });
    }
});
