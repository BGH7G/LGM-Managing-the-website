<script setup>
 const sections = [
   {
     key: 'account',
     title: '账户与登录',
     icon: 'mdi-account',
     description: '关于注册、登录、密码与安全的常见问题。',
     faqs: [
       {
         q: '如何注册账户？',
         a: '点击登录页面的“注册”按钮，按提示填写邮箱、密码与基本信息后提交。',
       },
       {
         q: '忘记密码怎么办？',
         a: '联系管理员，让他为你找回，目前不具有用户找回密码的能力。',
       },
       {
         q: '为什么无法登录？',
         a: '请检查账号密码、网络环境与账户状态；多次失败后稍候再试或联系管理员。',
       },
       {
         q: '为什么只有一个admin用户？',
         a: '目前仅导师有admin权限，注册时无法选择admin角色。',
       },
     ],
   },
   {
     key: 'members',
     title: '成员与角色',
     icon: 'mdi-account-group',
     description: '关于成员管理、角色与权限的常见问题。',
     faqs: [
       {
         q: '如何成为新成员？',
         a: '开学时会短暂开放一段时间供用户注册。',
       },
       {
         q: '角色权限有哪些区别？',
         a: '不同角色在查看/编辑/审批等权限上有所区别。请以系统实际配置为准。',
       },
       {
         q: '如何修改成员信息？',
         a: '可在个人资料页面修改头像、姓名、邮箱等基础信息。',
       },
       {
         q: '成员停用与恢复如何操作？',
         a: '管理员可在成员详情中执行停用/恢复操作。停用后成员将无法登录。',
       },
     ],
   },
 ]

 const contacts = [
   { icon: 'mdi-email-outline', label: '邮箱', value: 'poppingg44269911@gamil.com' },
   { icon: 'mdi-phone-outline', label: '电话', value: '156-1069-5037' },
   { icon: 'mdi-wechat', label: '微信', value: '156-1069-5037' },
 ]
</script>

<template>
  <v-container class="py-10">
    <div class="text-center mb-8">
      <div class="text-h3 font-weight-bold">帮助中心</div>
      <div class="text-body-1 text-medium-emphasis mt-2">快速找到你的答案</div>
    </div>

    <div>
      <template v-for="section in sections" :key="section.key">
        <v-card class="mb-8" variant="elevated">
          <v-card-text class="pb-0">
            <div class="d-flex align-center">
              <v-icon :icon="section.icon" class="me-2"></v-icon>
              <span class="text-h5 font-weight-bold">{{ section.title }}</span>
            </div>
            <div class="text-body-2 text-medium-emphasis mt-1">
              {{ section.description }}
            </div>
          </v-card-text>
          <v-card-text>
            <v-expansion-panels accordion density="comfortable">
              <v-expansion-panel v-for="(item, i) in section.faqs" :key="i">
                <v-expansion-panel-title>
                  <div class="d-flex align-center">
                    <v-icon color="primary" class="me-2" icon="mdi-comment-question-outline"></v-icon>
                    <span class="font-weight-medium">{{ item.q }}</span>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <div class="text-body-2">{{ item.a }}</div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>
      </template>
    </div>

    <v-card class="mb-8" variant="tonal">
      <v-card-title class="py-4">
        <div class="d-flex align-center">
          <v-icon class="me-2" icon="mdi-lifebuoy"></v-icon>
          <span class="text-subtitle-1 font-weight-bold">联系与支持</span>
        </div>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4" v-for="(c, idx) in contacts" :key="idx">
            <div class="d-flex align-center">
              <v-icon class="me-3" :icon="c.icon"></v-icon>
              <div>
                <div class="text-body-2 text-medium-emphasis">{{ c.label }}</div>
                <div class="text-body-1">{{ c.value }}</div>
              </div>
            </div>
          </v-col>
        </v-row>
        <div class="text-caption text-medium-emphasis mt-2">
          服务时间：工作日 09:00–18:00
        </div>
      </v-card-text>
    </v-card>

  </v-container>
</template>

<style scoped>
/* 如需个性化样式，可在此处补充。当前保持与主题一致的简洁风格。 */
</style>