# Patrimônio da Mídia

Sistema simples para organizar o inventário, a identificação patrimonial e o plano de compras dos equipamentos da equipe de mídia.

## Estrutura

- **Visão geral:** resumo do inventário, conservação e próximas aquisições.
- **Inventário:** cadastro dos equipamentos, quantidades, estado de conservação e número patrimonial editável diretamente na tabela.
- **Plano de compras:** prioridade, quantidade, valor unitário estimado, total calculado e situação da compra.

## Tecnologias

HTML, CSS e JavaScript puro. Os dados são salvos no `localStorage` do navegador, sem servidor ou banco de dados.

## Publicação no GitHub Pages

1. Abra **Settings → Pages** no repositório.
2. Em **Build and deployment**, selecione **Deploy from a branch**.
3. Escolha a branch **main** e a pasta **/(root)**.
4. Salve e aguarde a publicação.
5. O endereço será `https://suaneden.github.io/patrimonio-midia-igreja/`.

## Importante sobre os dados

O armazenamento local é específico do navegador e do dispositivo. Para preservar ou transferir os registros, use **Exportar backup** e guarde o arquivo JSON. Para continuar os mesmos dados em outro dispositivo, importe esse backup nele.

A lista inicial foi carregada com os itens e quantidades informados pela equipe. Os estados de conservação não informados foram marcados como **Não informado**; o estabilizador foi marcado como **Danificado**, conforme a descrição recebida.

## Estrutura de arquivos

- `index.html`
- `style.css`
- `script.js`
