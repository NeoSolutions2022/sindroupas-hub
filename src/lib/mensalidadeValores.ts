const moeda = (valor: number) => Number(valor.toFixed(2));

// O total deve refletir o arredondamento de cada boleto enviado à emissão.
export function calcularValoresMensalidade(valorBase: number, descontoPercentual: number, meses: number, unificar: boolean) {
  const percentual = Number.isFinite(descontoPercentual) ? Math.min(Math.max(descontoPercentual, 0), 100) : 0;
  const descontoMensal = valorBase * percentual / 100;
  const liquidoMensal = Math.max(valorBase - descontoMensal, 0);
  const quantidadeBoletos = meses > 0 ? (unificar ? 1 : meses) : 0;
  const multiplicador = unificar ? meses : 1;
  const valorBoleto = moeda(liquidoMensal * multiplicador);
  const descontoBoleto = moeda(descontoMensal * multiplicador);
  return {
    valorMensal: valorBase,
    descontoPercentual: percentual,
    descontoValorMensal: moeda(descontoMensal),
    valorMensalComDesconto: moeda(liquidoMensal),
    quantidadeBoletos,
    valorBoleto,
    descontoBoleto,
    valorTotal: moeda(valorBoleto * quantidadeBoletos),
  };
}
