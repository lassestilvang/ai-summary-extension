const paragraphs = Array.from(document.querySelectorAll('p')).map(p => p.textContent);
const pageContent = paragraphs.join('\n');

chrome.runtime.sendMessage({ action: 'process_content', content: pageContent });
