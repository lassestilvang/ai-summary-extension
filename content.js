const paragraphs = Array.from(document.querySelectorAll('p')).map(p => p.textContent);
const pageContent = paragraphs.join('\n');

chrome.runtime.sendMessage({ action: 'process_content', content: pageContent });

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'display_inline_summary') {
    const summaryDiv = document.createElement('div');
    summaryDiv.style.position = 'fixed';
    summaryDiv.style.top = '0';
    summaryDiv.style.left = '0';
    summaryDiv.style.width = '100%';
    summaryDiv.style.backgroundColor = '#f0f0f0';
    summaryDiv.style.padding = '10px';
    summaryDiv.style.borderBottom = '1px solid #ccc';
    summaryDiv.style.zIndex = '99999';
    summaryDiv.textContent = request.summary;
    document.body.prepend(summaryDiv);
  }
});
