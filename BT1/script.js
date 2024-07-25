document.getElementById("drop-area").addEventListener("dragover", (event) => {
    event.preventDefault();
    event.currentTarget.classList.add("highlight");
  });
  
  document.getElementById("drop-area").addEventListener("dragleave", (event) => {
    event.currentTarget.classList.remove("highlight");
  });
  
  document.getElementById("drop-area").addEventListener("drop", (event) => {
    event.preventDefault();
    event.currentTarget.classList.remove("highlight");
    
    const file = event.dataTransfer.files[0];
    if (file && file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (e) => {
        worker.postMessage(e.target.result);
      };
      reader.readAsText(file);
    } else {
      document.getElementById("result").innerText = "Please drop a valid .txt file.";
    }
  });
  