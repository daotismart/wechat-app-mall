const WXAPI = require('../../wxapi/main')
const CONFIG = require('../../config.js')
//获取应用实例
var app = getApp()
Page({
  data: {
    hasToken: false,
    indicatorDots: true,
    autoplay: true,
    interval: 3000,
    duration: 1000,
    loadingHidden: false, // loading
    userInfo: {},
    swiperCurrent: 0,
    selectCurrent: 0,
    categories: [],
    activeCategoryId: 0,
    goods: [],
    scrollTop: 0,
    loadingMoreHidden: true,

    hasNoCoupons: true,
    coupons: [],
    searchInput: '',

    curPage: 1,
    pageSize: 20,
    hideSummaryPopup: true,
    totalPrice: 0,
    totalScore: 0
  },

  tabClick: function(e) {
    this.setData({
      activeCategoryId: e.currentTarget.id,
      curPage: 1
    });
    this.getGoodsList(this.data.activeCategoryId);
  },
  //事件处理函数
  swiperchange: function(e) {
    //console.log(e.detail.current)
    this.setData({
      swiperCurrent: e.detail.current
    })
  },
  toDetailsTap: function(e) {
    wx.navigateTo({
      url: "/pages/goods-details/index?id=" + e.currentTarget.dataset.id + "&hideShopPopup=" + e.currentTarget.dataset.hideShopPopup
    })
  },
  tapBanner: function(e) {
    if (e.currentTarget.dataset.id != 0) {
      wx.navigateTo({
        url: "/pages/goods-details/index?id=" + e.currentTarget.dataset.id
      })
    }
  },
  bindTypeTap: function(e) {
    this.setData({
      selectCurrent: e.index
    })
  },
  onLoad: function() {
    var that = this
    let token = wx.getStorageSync('token');
    if (token) {
      this.setData({
        hasToken: true
      })
    }
    wx.setNavigationBarTitle({
      title: wx.getStorageSync('mallName')
    })

    var shopCarInfo = wx.getStorageSync('shopCarInfo');
    var hideSummaryPopup = true;
    if (shopCarInfo.shopList && shopCarInfo.shopList.length > 0) {
      hideSummaryPopup = false;
    }
    that.setData({
      hideSummaryPopup: hideSummaryPopup,
      totalPrice: shopCarInfo.totalPrice,
      totalScore: shopCarInfo.totalScore,
      shopNum: shopCarInfo.shopNum
    });

    /**
     * 示例：
     * 调用接口封装方法
     */
    WXAPI.banners({
      type: 'index'
    }).then(function(res) {
      if (res.code == 700) {
        wx.showModal({
          title: '提示',
          content: '请在后台添加 banner 轮播图片，自定义类型填写 index',
          showCancel: false
        })
      } else {
        that.setData({
          banners: res.data
        });
      }
    }).catch(function(e) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
    })
    WXAPI.goodsCategory().then(function(res) {
      var categories = [{
        id: 0,
        name: "全部"
      }];
      if (res.code == 0) {
        for (var i = 0; i < res.data.length; i++) {
          categories.push(res.data[i]);
        }
      }
      that.setData({
        categories: categories,
        activeCategoryId: 0,
        curPage: 1
      });
      that.getGoodsList(0);
    })
    that.getCoupons();
    that.getNotice();
  },
  onPageScroll(e) {
    let scrollTop = this.data.scrollTop
    this.setData({
      scrollTop: e.scrollTop
    })
  },
  getGoodsList: function(categoryId, append) {
    if (categoryId == 0) {
      categoryId = "";
    }
    var that = this;
    wx.showLoading({
      "mask": true
    })
    WXAPI.goods({
      categoryId: categoryId,
      nameLike: that.data.searchInput,
      page: this.data.curPage,
      pageSize: this.data.pageSize
    }).then(function(res) {
      wx.hideLoading()
      if (res.code == 404 || res.code == 700) {
        let newData = {
          loadingMoreHidden: false
        }
        if (!append) {
          newData.goods = []
        }
        that.setData(newData);
        return
      }
      let goods = [];
      if (append) {
        goods = that.data.goods
      }
      for (var i = 0; i < res.data.length; i++) {
        res.data[i].buyNum = that.getGoodsNumInShopCard(res.data[i].id);
        goods.push(res.data[i]);
      }
      that.setData({
        loadingMoreHidden: true,
        goods: goods,
      });
    })
  },
  getGoodsNumInShopCard: function (goodsId) {
    var shopCarInfo = wx.getStorageSync('shopCarInfo');
    if (shopCarInfo.shopList && shopCarInfo.shopList.length > 0) {
      for (var i = 0; i < shopCarInfo.shopList.length; i++) {
        var tmpShopCarMap = shopCarInfo.shopList[i];
        if (tmpShopCarMap.goodsId == goodsId) {
          return tmpShopCarMap.number;
        }
      }
    }
    return 0;
  },
  getCoupons: function() {
    var that = this;
    WXAPI.coupons().then(function (res) {
      if (res.code == 0) {
        that.setData({
          hasNoCoupons: false,
          coupons: res.data
        });
      }
    })
  },
  gitCoupon: function(e) {
    const that = this
    if (e.currentTarget.dataset.pwd) {
      wx.navigateTo({
        url: "/pages/fetch-coupon/index?id=" + e.currentTarget.dataset.id
      })
      return
    }
    WXAPI.fetchCoupons({
      id: e.currentTarget.dataset.id,
      token: wx.getStorageSync('token')
    }).then(function (res) {
      if (res.code == 20001 || res.code == 20002) {
        wx.showModal({
          title: '错误',
          content: '来晚了',
          showCancel: false
        })
        return;
      }
      if (res.code == 20003) {
        wx.showModal({
          title: '错误',
          content: '你领过了，别贪心哦~',
          showCancel: false
        })
        return;
      }
      if (res.code == 30001) {
        wx.showModal({
          title: '错误',
          content: '您的积分不足',
          showCancel: false
        })
        return;
      }
      if (res.code == 20004) {
        wx.showModal({
          title: '错误',
          content: '已过期~',
          showCancel: false
        })
        return;
      }
      if (res.code == 0) {
        wx.showToast({
          title: '领取成功，赶紧去下单吧~',
          icon: 'success',
          duration: 2000
        })
      } else {
        wx.showModal({
          title: '错误',
          content: res.msg,
          showCancel: false
        })
      }
    })
  },
  onShareAppMessage: function() {
    return {
      title: wx.getStorageSync('mallName') + '——' + CONFIG.shareProfile,
      path: '/pages/index/index',
      success: function(res) {
        // 转发成功
      },
      fail: function(res) {
        // 转发失败
      }
    }
  },
  getNotice: function() {
    var that = this;
    WXAPI.noticeList({pageSize: 5}).then(function (res) {
      if (res.code == 0) {
        that.setData({
          noticeList: res.data
        });
      }
    })
  },
  listenerSearchInput: function(e) {
    this.setData({
      searchInput: e.detail.value
    })

  },
  toSearch: function() {
    this.setData({
      curPage: 1
    });
    this.getGoodsList(this.data.activeCategoryId);
  },
  onReachBottom: function() {
    this.setData({
      curPage: this.data.curPage + 1
    });
    this.getGoodsList(this.data.activeCategoryId, true)
  },
  onTotalPriceChange: function (e) {
    let hideSummaryPopup = true;
    if (e.detail.totalPrice > 0) {
      hideSummaryPopup = false;
    }
    this.setData({
      hideSummaryPopup: hideSummaryPopup,
      totalPrice: e.detail.totalPrice,
      totalScore: e.detail.totalScore,
      shopNum: e.detail.shopNum
    });

  },
  navigateToPayOrder: function () {
    wx.hideLoading();
    wx.navigateTo({
      url: "/pages/to-pay-order/index"
    })
  },

  navigateToCartShop: function () {
    wx.hideLoading();
    wx.switchTab({
      url: "/pages/shop-cart/index"
    })
  },

  onShow: function () {
    this.onLoad();
  },
  askPrice: function () {
    wx.showModal({
      title: '询价',
      content: '咨询价格相关请联系我们 http://www.oejia.net/ 商榷，谢谢！',
      showCancel: false
    })
  },
  onPullDownRefresh: function() {
    this.setData({
      curPage: 1
    });
    this.getGoodsList(this.data.activeCategoryId)
  }
})