<template>
  <div class="subscription-page">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          Subscription Plans
        </h1>
        <p class="page-subtitle">
          Select a plan that suits you
        </p>
      </div>
      <div class="header-decoration" />
    </div>

    <div class="commodities-section">
      <div
        v-loading="commodityLoading"
        class="commodities-grid"
      >
        <div
          v-for="item in commodityList"
          :key="item.id"
          class="commodity-card"
          :class="{ 'is-disabled': item.discountPrice === 0 }"
        >
          <div
            v-if="item.originalPrice && item.discountPrice !== undefined && item.discountPrice < item.originalPrice && item.discountPrice !== 0"
            class="discount-badge"
          >
            {{ Math.round((1 - item.discountPrice / item.originalPrice) * 100) }}% off
          </div>

          <div class="card-inner">
            <div class="card-header">
              <span class="plan-name">{{ item.name }}</span>
            </div>

            <div class="price-section">
              <div class="current-price">
                <span class="currency">CNY</span>
                <span class="amount">{{ formatPriceInt(item.discountPrice) }}</span>
                <span class="decimal">.{{ formatPriceDecimal(item.discountPrice) }}</span>
              </div>
              <div
                v-if="item.originalPrice && item.discountPrice !== undefined && item.originalPrice > item.discountPrice"
                class="original-price"
              >
                CNY {{ formatPrice(item.originalPrice) }}
              </div>
            </div>

            <div
              v-if="item.code"
              class="plan-remark"
            >
              {{ item.code }}
            </div>

            <div
              v-if="item.remark"
              class="plan-benefits"
            >
              <div
                v-for="(benefit, idx) in parseRemarkBenefits(item.remark)"
                :key="idx"
                class="benefit-item"
              >
                <span class="benefit-icon">+</span>
                <span class="benefit-text">{{ benefit }}</span>
              </div>
            </div>

            <button
              class="subscribe-btn"
              :disabled="item.discountPrice === 0"
              @click="handleSubscribe(item)"
            >
              <span class="btn-text">{{ item.discountPrice === 0 ? 'Unavailable' : 'Subscribe' }}</span>
              <span
                v-if="item.discountPrice !== 0"
                class="btn-arrow"
              >-></span>
            </button>
          </div>
        </div>

        <div
          v-if="!commodityLoading && commodityList.length === 0"
          class="empty-state"
        >
          <div class="empty-icon">
            O
          </div>
          <p>No subscription plans available</p>
        </div>
      </div>
    </div>

    <div class="orders-section">
      <div class="section-header">
        <h2 class="section-title">
          Order History
        </h2>
        <div class="section-line" />
      </div>

      <div
        v-loading="orderLoading"
        class="orders-container"
      >
        <div
          v-if="orderList.length > 0"
          class="orders-list"
        >
          <div
            v-for="order in orderList"
            :key="order.id"
            class="order-item"
          >
            <div class="order-info">
              <div class="order-main">
                <span class="order-name">{{ order.commodityName || '-' }}</span>
                <span
                  class="order-status"
                  :class="getStatusClass(order.status)"
                >{{ getStatusText(order.status) }}</span>
              </div>
              <div class="order-details">
                <span class="order-id">#{{ order.id }}</span>
                <span class="order-time">{{ formatTime(order.payTime) }}</span>
              </div>
            </div>
            <div class="order-price">
              <span class="price-label">Amount</span>
              <span class="price-value">CNY {{ formatPriceInt(order.payPrice) }}<span class="price-decimal">.{{ formatPriceDecimal(order.payPrice) }}</span></span>
            </div>
          </div>
        </div>

        <div
          v-if="!orderLoading && orderList.length === 0"
          class="empty-state"
        >
          <div class="empty-icon">
            [ ]
          </div>
          <p>No order history</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getCommodityListApi } from '@/api/modules/pay/commodity'
import { getCurrentUserOrderListApi } from '@/api/modules/pay/order'
import { getPayPage } from '@/api/modules/pay/pay'
import type { ICommodity } from '@/api/interface/pay/commodity'
import type { IOrder } from '@/api/interface/pay/order'

const commodityList = ref<ICommodity.Row[]>([])
const orderList = ref<IOrder.Row[]>([])
const commodityLoading = ref(false)
const orderLoading = ref(false)
const subscribing = ref(false)

const fetchCommodities = async () => {
  commodityLoading.value = true
  const { data } = await getCommodityListApi({ type: '2', page: 1, limit: 100 })
  commodityList.value = data?.rows || []
  commodityLoading.value = false
}

const fetchOrders = async () => {
  orderLoading.value = true
  const { data } = await getCurrentUserOrderListApi()
  orderList.value = data?.rows || []
  orderLoading.value = false
}

const handleSubscribe = async (item: ICommodity.Row) => {
  if (item.discountPrice === 0 || subscribing.value) return
  subscribing.value = true
  const { data } = await getPayPage({ commodityId: item.id, payChannel: 'W' })
  subscribing.value = false
  if (data) {
    window.location.href = data
  }
}

const formatPrice = (price?: number) => {
  if (price === undefined || price === null) return '0.00'
  return (price / 100).toFixed(2)
}

const formatPriceInt = (price?: number) => {
  if (price === undefined || price === null) return '0'
  return Math.floor(price / 100).toString()
}

const formatPriceDecimal = (price?: number) => {
  if (price === undefined || price === null) return '00'
  return String(price % 100).padStart(2, '0')
}

const parseRemarkBenefits = (remark?: string): string[] => {
  if (!remark) return []
  return remark.split(',').map(item => item.trim()).filter(Boolean)
}

const formatTime = (time?: string) => {
  if (!time) return '-'
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const getStatusText = (status?: string) => {
  return status || '-'
}

const getStatusClass = (status?: string) => {
  const map: Record<string, string> = {
    'SUCCESS': 'success',
    'REFUND': 'gray',
    'NOTPAY': 'gray',
    'CLOSED': 'closed',
    'USERPAYING': 'success',
    'PAYERROR': 'error',
    'EXCEPTION': 'error'
  }
  return map[status || ''] || ''
}

onMounted(() => {
  fetchCommodities()
  fetchOrders()
})
</script>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Noto+Sans+SC:wght@400;500;700&display=swap');

.subscription-page {
  min-height: 100vh;
  background: #fafafa;
  padding: 40px;
  font-family: 'Noto Sans SC', sans-serif;
}

.page-header {
  position: relative;
  margin-bottom: 48px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e0e0e0;

  .header-content {
    position: relative;
    z-index: 1;
  }

  .page-title {
    font-family: 'Space Mono', monospace;
    font-size: 42px;
    font-weight: 700;
    color: #0a0a0a;
    letter-spacing: -1px;
    margin: 0 0 8px;
  }

  .page-subtitle {
    font-size: 15px;
    color: #666;
    margin: 0;
    letter-spacing: 0.5px;
  }

  .header-decoration {
    position: absolute;
    top: -10px;
    right: 0;
    width: 120px;
    height: 120px;
    background: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 4px,
      #f0f0f0 4px,
      #f0f0f0 8px
    );
    opacity: 0.8;
  }
}

.commodities-section {
  margin-bottom: 64px;
}

.commodities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  min-height: 200px;
}

.commodity-card {
  position: relative;
  background: #fff;
  border: 1px solid #e0e0e0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: #0a0a0a;
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s ease;
  }

  &:hover:not(.is-disabled) {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);

    &::before {
      transform: scaleX(1);
    }
  }

  &.is-disabled {
    opacity: 0.6;

    .card-inner {
      filter: grayscale(0.5);
    }
  }
}

.discount-badge {
  position: absolute;
  top: 16px;
  right: -8px;
  background: #0a0a0a;
  color: #fff;
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 12px;
  letter-spacing: 0.5px;

  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    right: 0;
    border: 4px solid transparent;
    border-top-color: #333;
    border-right-color: #333;
  }
}

.card-inner {
  padding: 32px 24px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;

  .plan-name {
    font-size: 20px;
    font-weight: 700;
    color: #0a0a0a;
  }

  .plan-code {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: #999;
    background: #f5f5f5;
    padding: 4px 8px;
    letter-spacing: 1px;
  }
}

.price-section {
  margin-bottom: 20px;

  .current-price {
    display: flex;
    align-items: baseline;
    gap: 6px;
    color: #0a0a0a;

    .currency {
      font-size: 14px;
      font-weight: 500;
    }

    .amount {
      font-family: 'Space Mono', monospace;
      font-size: 48px;
      font-weight: 700;
      line-height: 1;
      letter-spacing: -2px;
    }

    .decimal {
      font-family: 'Space Mono', monospace;
      font-size: 18px;
      font-weight: 500;
      color: #666;
    }
  }

  .original-price {
    font-family: 'Space Mono', monospace;
    font-size: 14px;
    color: #999;
    text-decoration: line-through;
    margin-top: 4px;
  }
}

.plan-benefits {
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f8f8;
  border-radius: 4px;

  .benefit-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;

    &:not(:last-child) {
      border-bottom: 1px dashed #e8e8e8;
    }

    .benefit-icon {
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0a0a0a;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      border-radius: 2px;
    }

    .benefit-text {
      font-family: 'Space Mono', monospace;
      font-size: 13px;
      color: #333;
      font-weight: 500;
    }
  }
}

.plan-remark {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 20px;
}

.subscribe-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  background: #0a0a0a;
  color: #fff;
  border: none;
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #333;

    .btn-arrow {
      transform: translateX(4px);
    }
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .btn-arrow {
    transition: transform 0.2s;
  }
}

.orders-section {
  .section-header {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 32px;

    .section-title {
      font-family: 'Space Mono', monospace;
      font-size: 24px;
      font-weight: 700;
      color: #0a0a0a;
      margin: 0;
      white-space: nowrap;
    }

    .section-line {
      flex: 1;
      height: 1px;
      background: linear-gradient(to right, #e0e0e0, transparent);
    }
  }
}

.orders-container {
  min-height: 120px;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: #fff;
  border: 1px solid #e0e0e0;
  transition: all 0.2s;

  &:hover {
    border-color: #0a0a0a;
  }
}

.order-info {
  .order-main {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }

  .order-name {
    font-size: 15px;
    font-weight: 700;
    color: #0a0a0a;
  }

  .order-status {
    font-size: 11px;
    font-weight: 500;
    padding: 3px 10px;
    border-radius: 2px;

    &.success {
      background: #e6f7e6;
      color: #389e0d;
    }

    &.gray {
      background: #f5f5f5;
      color: #999;
    }

    &.closed {
      background: #262626;
      color: #fff;
    }

    &.error {
      background: #fff1f0;
      color: #cf1322;
    }
  }

  .order-details {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #999;

    .order-id {
      font-family: 'Space Mono', monospace;
    }
  }
}

.order-price {
  text-align: right;

  .price-label {
    display: block;
    font-size: 11px;
    color: #999;
    margin-bottom: 4px;
  }

  .price-value {
    font-family: 'Space Mono', monospace;
    font-size: 20px;
    font-weight: 700;
    color: #0a0a0a;
  }
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #999;

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .subscription-page {
    padding: 24px 16px;
  }

  .page-header {
    .page-title {
      font-size: 28px;
    }

    .header-decoration {
      display: none;
    }
  }

  .order-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;

    .order-price {
      text-align: left;
      padding-top: 16px;
      border-top: 1px dashed #e0e0e0;
      width: 100%;
    }
  }
}
</style>
