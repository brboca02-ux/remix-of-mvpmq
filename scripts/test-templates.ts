import { PREBUILT_TEMPLATES } from '../src/lib/prebuilt-templates';

async function testAllTemplates() {
  console.log(`🚀 Iniciando teste de ${PREBUILT_TEMPLATES.length} templates...\n`);
  
  const results = {
    success: 0,
    failed: 0,
    details: [] as any[]
  };

  for (const template of PREBUILT_TEMPLATES) {
    try {
      console.log(`Testing [${template.id}] - ${template.niche}...`);
      
      const requiredFields = ['id', 'companyName', 'niche', 'services', 'differentials', 'thumbnail'];
      const missingFields = requiredFields.filter(field => !template[field as keyof typeof template]);
      
      if (missingFields.length > 0) {
        throw new Error(`Campos obrigatórios ausentes: ${missingFields.join(', ')}`);
      }

      if (!Array.isArray(template.services) || template.services.length === 0) {
        throw new Error('Lista de serviços está vazia ou inválida');
      }

      results.success++;
      results.details.push({ id: template.id, status: 'OK' });
    } catch (error: any) {
      results.failed++;
      results.details.push({ id: template.id, status: 'FAILED', error: error.message });
      console.error(`❌ Erro no template ${template.id}: ${error.message}`);
    }
  }

  console.log('\n--- Relatório Final ---');
  console.log(`✅ Sucesso: ${results.success}`);
  console.log(`❌ Falhas: ${results.failed}`);
  console.log('-----------------------\n');

  if (results.failed > 0) {
    process.exit(1);
  }
}

testAllTemplates().catch(err => {
  console.error('Erro fatal no script de teste:', err);
  process.exit(1);
});
