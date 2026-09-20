function decode(value='') { return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>'); }
function tag(block, name) { const m=block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`,'i')); return m ? decode(m[1].trim()) : ''; }
export default async function handler(req, res) {
  try {
    const feed='https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko';
    const response=await fetch(feed,{headers:{'User-Agent':'Mozilla/5.0'}});
    if(!response.ok) throw new Error(`News feed returned ${response.status}`);
    const xml=await response.text();
    const items=[...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0,5).map((match,index)=>{
      const block=match[1]; const fullTitle=tag(block,'title'); const parts=fullTitle.split(' - ');
      return {id:index+1,title:parts.slice(0,-1).join(' - ')||fullTitle,source:parts.length>1?parts.at(-1):'Google 뉴스',url:tag(block,'link'),publishedAt:tag(block,'pubDate'),summary:decode(tag(block,'description')).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()};
    });
    res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=600');
    res.status(200).json({retrievedAt:new Date().toISOString(),source:'Google 뉴스 RSS',items});
  } catch(error) { res.status(502).json({error:'최신 뉴스 피드를 불러오지 못했습니다.',detail:error.message}); }
}
