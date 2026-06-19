const path = require('path');
const fs = require('fs');

(async () => {
  const testDir = __dirname;
  const testFiles = fs.readdirSync(testDir)
    .filter(f => /^\d{2}-.*\.js$/.test(f))
    .sort();

  if (testFiles.length === 0) {
    console.log('没有找到测试文件');
    process.exit(1);
  }

  console.log(`=== 通辽144 回归测试 (${new Date().toLocaleString('zh-CN')}) ===`);
  console.log(`共 ${testFiles.length} 个测试套件\n`);

  let totalPassed = 0, totalFailed = 0, totalTests = 0;
  const failedSuites = [];

  for (const file of testFiles) {
    const mod = require(path.join(testDir, file));
    const startTime = Date.now();

    console.log(`▶ ${mod.name}`);
    console.log('─'.repeat(50));

    try {
      const { passed, failed, total, results } = await mod.run();
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      for (const r of results) {
        const icon = r.pass ? '  ✓' : '  ✗';
        const detail = r.detail ? ` (${r.detail})` : '';
        console.log(`${icon} ${r.name}${detail}`);
      }

      const statusIcon = failed === 0 ? '✓' : '✗';
      console.log(`\n${statusIcon} ${mod.name}: ${passed}/${total} 通过 (${elapsed}s)\n`);

      totalPassed += passed;
      totalFailed += failed;
      totalTests += total;
      if (failed > 0) failedSuites.push(mod.name);

    } catch (e) {
      console.log(`  ✗ 套件执行异常: ${e.message}\n`);
      totalFailed++;
      totalTests++;
      failedSuites.push(mod.name);
    }
  }

  console.log('═'.repeat(50));
  console.log(`总计: ${totalPassed}/${totalTests} 通过, ${totalFailed} 失败`);

  if (totalFailed > 0) {
    console.log(`\n失败的套件:`);
    failedSuites.forEach(s => console.log(`  - ${s}`));
    console.log('\n✗ 回归测试未通过');
    process.exit(1);
  } else {
    console.log('\n✓ 全部回归测试通过!');
    process.exit(0);
  }
})();
