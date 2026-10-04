import { readFile, writeFile, mkdir } from 'node:fs/promises';
import process from 'node:process';
const readJson=async p=>JSON.parse(await readFile(p,'utf8'));
const stable=value=>JSON.stringify(value,null,2)+'\n';
export async function generateCompatibilityManifests({pluginManifestPath='plugin.json',portableMcpPath='mcp.json',outputRoot='.'}={}){
  const plugin=await readJson(pluginManifestPath); const mcp=await readJson(portableMcpPath);
  const entries=Object.entries(mcp.mcpServers||{});
  if(entries.length!==1) throw new Error('Arena portable package must declare exactly one active MCP server');
  const [name,server]=entries[0];
  if(name!=='github_arena'||server.type!=='stdio'||server.command!=='node') throw new Error('Arena active MCP must be github_arena over stdio node');
  if(JSON.stringify(mcp).includes('streamable-http')) throw new Error('HTTP adapter must not be active in this slice');
  const args=(server.args||[]).map(x=>x.replace('${PLUGIN_ROOT}/','./'));
  const cwd=server.cwd==='${PLUGIN_ROOT}'?'.':server.cwd;
  const compatPlugin={
    name:plugin.name,version:plugin.version,description:plugin.description,
    author:plugin.author,homepage:plugin.homepage,repository:plugin.repository,license:plugin.license,keywords:plugin.keywords,
    skills:'./skills/',mcpServers:'./.mcp.json',
    interface:{displayName:'GitHub Arena',shortDescription:'Multi-strategy review layer for every GitHub task.'}
  };
  const compatMcp={mcpServers:{[name]:{type:server.type,command:server.command,args,cwd}}};
  return {plugin:stable(compatPlugin),mcp:stable(compatMcp)};
}
async function main(){
  const check=process.argv.includes('--check'); const generated=await generateCompatibilityManifests();
  if(check){
    const currentPlugin=await readFile('.codex-plugin/plugin.json','utf8').catch(()=>null);
    const currentMcp=await readFile('.mcp.json','utf8').catch(()=>null);
    if(currentPlugin!==generated.plugin||currentMcp!==generated.mcp){console.error('compatibility manifests are stale');process.exit(1);} return;
  }
  await mkdir('.codex-plugin',{recursive:true}); await writeFile('.codex-plugin/plugin.json',generated.plugin); await writeFile('.mcp.json',generated.mcp);
}
if(import.meta.url===`file://${process.argv[1]}`) main().catch(e=>{console.error(e.stack||e);process.exit(1);});
