self.onmessage = function(e) {
    const text = e.data;
    const cleanedText = text.replace(/[.,]/g, '').toLowerCase();
    const words = cleanedText.split(/\s+/);
    const wordCount = {};
    
    words.forEach(word => {
      if (wordCount[word]) {
        wordCount[word]++;
      } else {
        wordCount[word] = 1;
      }
    });
    
    const uniqueWords = Object.keys(wordCount);
    
    if (uniqueWords.length < 3) {
      self.postMessage("The file must contain at least 3 different words.");
      return;
    }
  
    const sortedWords = uniqueWords.sort((a, b) => wordCount[b] - wordCount[a]);
    
    const top3Words = sortedWords.slice(0, 3).map(word => `${word}: ${wordCount[word]} times`);
    const result = `
      Total unique words: ${uniqueWords.length}
      Top 3 most frequent words: ${top3Words.join(', ')}
    `;
    self.postMessage(result);
  };
  